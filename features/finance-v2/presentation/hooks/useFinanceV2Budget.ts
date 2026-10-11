"use client";

import { useMemo, useRef, useState } from "react";
import type {
  BucketKey,
  BudgetConfig,
  BudgetFrequency,
  BudgetVersion,
  IncomeSource,
  Weekday,
} from "@/features/finance-v2/domain";
import {
  addCategory as domainAddCategory,
  addIncomeSource as domainAddIncomeSource,
  addSubcategory as domainAddSubcategory,
  clampAmount,
  computeBudgetComparison,
  deleteCategory as domainDeleteCategory,
  deleteIncomeSource as domainDeleteIncomeSource,
  deleteSubcategory as domainDeleteSubcategory,
  renameCategory as domainRenameCategory,
  renameIncomeSource as domainRenameIncomeSource,
  renameSubcategory as domainRenameSubcategory,
  resolveBudgetForMonth,
  setIncomeSourceAmount,
  setLeafAmount,
  setLeafFrequency,
  setLeafWeekday,
  upsertBudgetVersion,
} from "@/features/finance-v2/domain";

// One shared instance, so memos keyed on `incomeSources` stay stable for legacy budgets.
const EMPTY_INCOME_SOURCES: IncomeSource[] = [];

interface Params {
  initialVersions: BudgetVersion[];
  /** The viewed month: it picks the budget version shown and edited, and weekly leaves'
   *  monthly budget depends on it (see `resolveLeafMonthlyAmount`). */
  month: string;
  onSave: (month: string, budget: BudgetConfig) => Promise<void> | void;
}

// Owns every budget version, not one config: the shown budget is DERIVED from
// `(versions, month)`, so it follows the viewed month with no re-sync effect or re-key.
// An edit clones the viewed month's resolved config through the pure mutations (leaf ids
// unchanged) and upserts it as that month's version, so earlier months keep theirs.
// Fire-and-forget persist on every mutation and on amount blur, no validity gate (design
// decision #7) — unlike tab 1, no budget state is ever invalid. `versionsRef` avoids stale
// closures across successive calls (same `persist*` pattern used across finance-v2 hooks).
export function useFinanceV2Budget({ initialVersions, month, onSave }: Params) {
  const [versions, setVersions] = useState<BudgetVersion[]>(initialVersions);
  const versionsRef = useRef(initialVersions);

  const config = useMemo(() => resolveBudgetForMonth(versions, month), [versions, month]);
  const comparison = useMemo(() => computeBudgetComparison(config, month), [config, month]);

  // Reads the ref, not `config`: two edits in the same tick must chain.
  const persist = (edit: (current: BudgetConfig) => BudgetConfig) => {
    const next = edit(resolveBudgetForMonth(versionsRef.current, month));
    versionsRef.current = upsertBudgetVersion(
      versionsRef.current,
      month,
      next,
      new Date().toISOString()
    );
    setVersions(versionsRef.current);
    void onSave(month, next);
  };

  const addCategory = (name: string, bucket: BucketKey) => {
    if (!name.trim()) return;
    persist((current) =>
      domainAddCategory(current, { id: crypto.randomUUID(), name: name.trim(), bucket })
    );
  };

  const addSubcategory = (categoryId: string, name: string, bucket: BucketKey) => {
    if (!name.trim()) return;
    persist((current) =>
      domainAddSubcategory(current, {
        categoryId,
        id: crypto.randomUUID(),
        name: name.trim(),
        bucket,
      })
    );
  };

  const deleteCategory = (categoryId: string) => {
    persist((current) => domainDeleteCategory(current, categoryId));
  };

  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    persist((current) => domainDeleteSubcategory(current, { categoryId, id: subcategoryId }));
  };

  const renameCategory = (categoryId: string, name: string) => {
    if (!name.trim()) return;
    persist((current) => domainRenameCategory(current, { categoryId, name: name.trim() }));
  };

  const renameSubcategory = (categoryId: string, subcategoryId: string, name: string) => {
    if (!name.trim()) return;
    persist((current) =>
      domainRenameSubcategory(current, { categoryId, id: subcategoryId, name: name.trim() })
    );
  };

  const handleAmountBlur = (categoryId: string, subcategoryId: string | null, raw: string) => {
    persist((current) =>
      setLeafAmount(current, { categoryId, subcategoryId, amount: clampAmount(raw) })
    );
  };

  const handleFrequencyChange = (
    categoryId: string,
    subcategoryId: string | null,
    frequency: BudgetFrequency
  ) => {
    persist((current) => setLeafFrequency(current, { categoryId, subcategoryId, frequency }));
  };

  const handleWeekdayChange = (
    categoryId: string,
    subcategoryId: string | null,
    weekday: Weekday
  ) => {
    persist((current) => setLeafWeekday(current, { categoryId, subcategoryId, weekday }));
  };

  const addIncomeSource = (name: string) => {
    if (!name.trim()) return;
    persist((current) =>
      domainAddIncomeSource(current, { id: crypto.randomUUID(), name: name.trim() })
    );
  };

  const renameIncomeSource = (id: string, name: string) => {
    if (!name.trim()) return;
    persist((current) => domainRenameIncomeSource(current, { id, name: name.trim() }));
  };

  const handleIncomeAmountBlur = (id: string, raw: string) => {
    persist((current) => setIncomeSourceAmount(current, { id, amount: clampAmount(raw) }));
  };

  const deleteIncomeSource = (id: string) => {
    persist((current) => domainDeleteIncomeSource(current, id));
  };

  return {
    categories: config.categories,
    // A budget saved before income budgeting has no field; consumers always get a list.
    incomeSources: config.incomeSources ?? EMPTY_INCOME_SOURCES,
    comparison,
    addCategory,
    addSubcategory,
    deleteCategory,
    deleteSubcategory,
    renameCategory,
    renameSubcategory,
    handleAmountBlur,
    handleFrequencyChange,
    handleWeekdayChange,
    addIncomeSource,
    renameIncomeSource,
    handleIncomeAmountBlur,
    deleteIncomeSource,
  };
}

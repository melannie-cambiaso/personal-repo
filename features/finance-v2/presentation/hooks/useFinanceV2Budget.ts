"use client";

import { useMemo, useRef, useState } from "react";
import type { BucketKey, BudgetConfig, SplitResult } from "@/features/finance-v2/domain";
import {
  addCategory as domainAddCategory,
  addSubcategory as domainAddSubcategory,
  clampAmount,
  computeBudgetComparison,
  deleteCategory as domainDeleteCategory,
  deleteSubcategory as domainDeleteSubcategory,
  setLeafAmount,
} from "@/features/finance-v2/domain";

interface Params {
  initialBudget: BudgetConfig;
  split: SplitResult;
  onSave: (budget: BudgetConfig) => Promise<void> | void;
}

// Fire-and-forget persist on every mutation and on amount blur, no validity gate (design
// decision #7) — unlike tab 1, no budget state is ever invalid. `configRef` avoids stale
// closures across successive calls (same `persist*` pattern used across finance-v2 hooks).
export function useFinanceV2Budget({ initialBudget, split, onSave }: Params) {
  const [config, setConfig] = useState<BudgetConfig>(initialBudget);
  const configRef = useRef(initialBudget);

  const comparison = useMemo(() => computeBudgetComparison(config, split), [config, split]);

  const persist = (next: BudgetConfig) => {
    configRef.current = next;
    setConfig(next);
    void onSave(next);
  };

  const addCategory = (name: string, bucket: BucketKey) => {
    if (!name.trim()) return;
    persist(
      domainAddCategory(configRef.current, { id: crypto.randomUUID(), name: name.trim(), bucket })
    );
  };

  const addSubcategory = (categoryId: string, name: string, bucket: BucketKey) => {
    if (!name.trim()) return;
    persist(
      domainAddSubcategory(configRef.current, {
        categoryId,
        id: crypto.randomUUID(),
        name: name.trim(),
        bucket,
      })
    );
  };

  const deleteCategory = (categoryId: string) => {
    persist(domainDeleteCategory(configRef.current, categoryId));
  };

  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    persist(domainDeleteSubcategory(configRef.current, { categoryId, id: subcategoryId }));
  };

  const handleAmountBlur = (categoryId: string, subcategoryId: string | null, raw: string) => {
    persist(
      setLeafAmount(configRef.current, { categoryId, subcategoryId, amount: clampAmount(raw) })
    );
  };

  return {
    categories: config.categories,
    comparison,
    addCategory,
    addSubcategory,
    deleteCategory,
    deleteSubcategory,
    handleAmountBlur,
  };
}

"use client";

import { useState } from "react";
import type {
  BucketKey,
  BudgetCategory,
  BudgetFrequency,
  Weekday,
} from "@/features/finance-v2/domain";
import { AccountCoverage } from "./AccountCoverage";
import type { AccountCoverageView } from "./accountCoverageView";
import { BudgetCategoryCard } from "./BudgetCategoryCard";
import { Button, Input, Select } from "@/shared/components";
import { BUCKET_LABELS, BUCKET_ORDER } from "../bucketLabels";
import { BUDGET_MODE_LABEL, type BudgetMode } from "./budgetMode";
import type { SpendView } from "./spendView";

interface Props {
  mode: BudgetMode;
  /** A closed (past) month: the edit toggle is hidden and a note says why. The caller
   *  also forces `mode` to `"view"`. */
  readOnly?: boolean;
  onToggleMode: () => void;
  categories: BudgetCategory[];
  /** The viewed month — weekly leaves' monthly budget depends on it. */
  month: string;
  /** Threaded from `FinanceV2Screen` into every `BudgetCategoryCard`. */
  spend: SpendView;
  /** Derived in `FinanceV2Screen` for the same viewed month and transactions as `spend`. */
  coverage: AccountCoverageView;
  onAmountBlur: (categoryId: string, subcategoryId: string | null, raw: string) => void;
  onAddCategory: (name: string, bucket: BucketKey) => void;
  onAddSubcategory: (categoryId: string, name: string, bucket: BucketKey) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  onFrequencyChange: (
    categoryId: string,
    subcategoryId: string | null,
    frequency: BudgetFrequency
  ) => void;
  onWeekdayChange: (categoryId: string, subcategoryId: string | null, weekday: Weekday) => void;
  onRenameCategory: (categoryId: string, name: string) => void;
  onRenameSubcategory: (categoryId: string, subcategoryId: string, name: string) => void;
}

// Presentational only — state lives in `useFinanceV2Budget`,
// hoisted in `FinanceV2Screen` (design decision #1's reasoning applies here too: the tabs
// are conditionally rendered, so an internally-owned hook would remount from the stale
// `initialBudgetVersions` prop and lose anything added since page load on every tab switch).
// Closes the `Empty-State Start` spec gap left open by the Unit B placeholder: comparison
// stays visible above the category list in every state, and the add-category affordance
// is always present, not just when the list is empty.
export function BudgetTab({
  mode,
  readOnly = false,
  onToggleMode,
  categories,
  month,
  spend,
  coverage,
  onAmountBlur,
  onAddCategory,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
  onFrequencyChange,
  onWeekdayChange,
  onRenameCategory,
  onRenameSubcategory,
}: Props) {
  const [name, setName] = useState("");
  const [bucket, setBucket] = useState<BucketKey>("fixed");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddCategory(name, bucket);
    setName("");
    setBucket("fixed");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Own row at the TOP, above `BucketComparison`, outside every conditional —
          structural guard against the empty-state trap: always reachable regardless
          of category count or current mode. A closed month swaps it for a note. */}
      <div className="flex justify-end">
        {readOnly ? (
          <p className="text-brown-500 text-sm">Presupuesto de un mes cerrado: solo lectura</p>
        ) : (
          <button
            type="button"
            aria-pressed={mode === "edit"}
            onClick={onToggleMode}
            className={`cursor-pointer rounded-full border-2 px-4 py-1.5 transition-colors ${
              mode === "edit"
                ? "border-sage-500 bg-sage-500 text-sage-800"
                : "border-sage-300 bg-cream-50 text-brown-600 hover:bg-sage-100"
            }`}
          >
            {BUDGET_MODE_LABEL[mode]}
          </button>
        )}
      </div>

      <AccountCoverage coverage={coverage} />

      {mode === "view" && categories.length === 0 ? (
        <p className="text-brown-500 text-sm">No hay categorías cargadas</p>
      ) : (
        <div className="flex flex-col gap-3">
          {[...categories]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((category) => (
              <BudgetCategoryCard
                key={category.id}
                mode={mode}
                category={category}
                month={month}
                spend={spend}
                onAmountBlur={onAmountBlur}
                onDeleteCategory={onDeleteCategory}
                onAddSubcategory={onAddSubcategory}
                onDeleteSubcategory={onDeleteSubcategory}
                onFrequencyChange={onFrequencyChange}
                onWeekdayChange={onWeekdayChange}
                onRenameCategory={onRenameCategory}
                onRenameSubcategory={onRenameSubcategory}
              />
            ))}
        </div>
      )}

      {mode === "edit" && (
        <form
          onSubmit={handleAddCategory}
          className="border-sage-300 bg-sage-100 flex flex-col gap-2 rounded-3xl border-2 p-4 sm:flex-row sm:items-end"
        >
          <Input
            aria-label="Nombre de la categoría"
            value={name}
            placeholder="Nueva categoría"
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            aria-label="Bucket de la categoría"
            value={bucket}
            onChange={(e) => setBucket(e.target.value as BucketKey)}
            options={BUCKET_ORDER.map((key) => ({ value: key, label: BUCKET_LABELS[key] }))}
          />
          <Button type="submit" variant="primary">
            Agregar categoría
          </Button>
        </form>
      )}
    </div>
  );
}

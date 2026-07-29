"use client";

import { useState } from "react";
import type {
  BucketKey,
  BudgetCategory,
  BudgetComparison as BudgetComparisonResult,
} from "@/features/finance-v2/domain";
import { BucketComparison } from "./BucketComparison";
import { BudgetCategoryCard } from "./BudgetCategoryCard";
import { Button, Input, Select } from "@/shared/components";
import { BUCKET_LABELS, BUCKET_ORDER } from "../bucketLabels";
import { BUDGET_MODE_LABEL, type BudgetMode } from "./budgetMode";
import type { SpendView } from "./spendView";

interface Props {
  mode: BudgetMode;
  onToggleMode: () => void;
  categories: BudgetCategory[];
  comparison: BudgetComparisonResult;
  /** Threaded from `FinanceV2Screen` (design D7/D8) into both `BucketComparison` and
   *  every `BudgetCategoryCard`. */
  spend: SpendView;
  onAmountBlur: (categoryId: string, subcategoryId: string | null, raw: string) => void;
  onAddCategory: (name: string, bucket: BucketKey) => void;
  onAddSubcategory: (categoryId: string, name: string, bucket: BucketKey) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
}

// Presentational only — state lives in `useFinanceV2Budget`,
// hoisted in `FinanceV2Screen` (design decision #1's reasoning applies here too: the tabs
// are conditionally rendered, so an internally-owned hook would remount from the stale
// `initialBudget` prop and lose anything added since page load on every tab switch).
// Closes the `Empty-State Start` spec gap left open by the Unit B placeholder: comparison
// stays visible above the category list in every state, and the add-category affordance
// is always present, not just when the list is empty.
export function BudgetTab({
  mode,
  onToggleMode,
  categories,
  comparison,
  spend,
  onAmountBlur,
  onAddCategory,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
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
          of category count or current mode. */}
      <div className="flex justify-end">
        <button
          type="button"
          aria-pressed={mode === "edit"}
          onClick={onToggleMode}
          className="bg-cream-100 text-brown-600 hover:bg-cream-200 cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          {BUDGET_MODE_LABEL[mode]}
        </button>
      </div>

      <BucketComparison comparison={comparison} spend={spend} />

      {mode === "view" && categories.length === 0 ? (
        <p className="text-brown-500 text-sm">No hay categorías cargadas</p>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((category) => (
            <BudgetCategoryCard
              key={category.id}
              mode={mode}
              category={category}
              spend={spend}
              onAmountBlur={onAmountBlur}
              onDeleteCategory={onDeleteCategory}
              onAddSubcategory={onAddSubcategory}
              onDeleteSubcategory={onDeleteSubcategory}
            />
          ))}
        </div>
      )}

      {mode === "edit" && (
        <form
          onSubmit={handleAddCategory}
          className="border-cream-300 flex items-end gap-2 rounded-xl border bg-white p-4"
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

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

interface Props {
  categories: BudgetCategory[];
  comparison: BudgetComparisonResult;
  onAmountBlur: (categoryId: string, subcategoryId: string | null, raw: string) => void;
  onAddCategory: (name: string, bucket: BucketKey) => void;
  onAddSubcategory: (categoryId: string, name: string, bucket: BucketKey) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
}

// Presentational only (mirrors `IncomeSplitTab`) — state lives in `useFinanceV2Budget`,
// hoisted in `FinanceV2Screen` (design decision #1's reasoning applies here too: the tabs
// are conditionally rendered, so an internally-owned hook would remount from the stale
// `initialBudget` prop and lose anything added since page load on every tab switch).
// Closes the `Empty-State Start` spec gap left open by the Unit B placeholder: comparison
// stays visible above the category list in every state, and the add-category affordance
// is always present, not just when the list is empty.
export function BudgetTab({
  categories,
  comparison,
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
      <BucketComparison comparison={comparison} />

      <div className="flex flex-col gap-3">
        {categories.map((category) => (
          <BudgetCategoryCard
            key={category.id}
            category={category}
            onAmountBlur={onAmountBlur}
            onDeleteCategory={onDeleteCategory}
            onAddSubcategory={onAddSubcategory}
            onDeleteSubcategory={onDeleteSubcategory}
          />
        ))}
      </div>

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
    </div>
  );
}

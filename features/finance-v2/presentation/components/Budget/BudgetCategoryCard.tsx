"use client";

import { useState } from "react";
import type { BucketKey, BudgetCategory } from "@/features/finance-v2/domain";
import { toCategoryView } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { Button, Input, Select } from "@/shared/components";
import { BUCKET_LABELS, BUCKET_ORDER } from "../bucketLabels";

interface Props {
  category: BudgetCategory;
  onAmountBlur: (categoryId: string, subcategoryId: string | null, raw: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (categoryId: string, name: string, bucket: BucketKey) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
}

// Branches on `CategoryView.kind` (design decision #2): a leaf gets a direct amount
// input, a parent gets a derived total + one row per subcategory — never both, never
// neither. Modeled on v1's `GroupSection`, one level deeper. Category delete requires
// `window.confirm` (cascade loses every subcategory amount); subcategory delete is
// immediate (design decision #10).
export function BudgetCategoryCard({
  category,
  onAmountBlur,
  onDeleteCategory,
  onAddSubcategory,
  onDeleteSubcategory,
}: Props) {
  const view = toCategoryView(category);

  // Uncontrolled amount inputs (`defaultValue`) only reflect fresh state on remount, so a
  // counter bumped on every blur forces one — same trick as `IncomeSplitTab`'s `version`.
  const [version, setVersion] = useState(0);
  const [subName, setSubName] = useState("");
  const [subBucket, setSubBucket] = useState<BucketKey>(category.bucket);

  const handleAmountBlur = (subcategoryId: string | null, raw: string) => {
    onAmountBlur(category.id, subcategoryId, raw);
    setVersion((v) => v + 1);
  };

  const handleDeleteCategory = () => {
    if (window.confirm(`¿Eliminar "${category.name}" y todas sus subcategorías?`)) {
      onDeleteCategory(category.id);
    }
  };

  const handleAddSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    onAddSubcategory(category.id, subName, subBucket);
    setSubName("");
    setSubBucket(category.bucket);
  };

  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-800 text-sm font-semibold">{category.name}</span>
        <button
          type="button"
          onClick={handleDeleteCategory}
          aria-label={`Eliminar categoría ${category.name}`}
          className="text-2xs text-brown-400 hover:text-red-600 cursor-pointer font-semibold transition-colors"
        >
          Eliminar
        </button>
      </div>

      {view.kind === "leaf" ? (
        <Input
          type="number"
          min="0"
          aria-label={`Monto de ${category.name}`}
          key={`amt-${category.id}-${version}`}
          defaultValue={view.amount || ""}
          placeholder="0"
          autoComplete="off"
          onBlur={(e) => handleAmountBlur(null, e.target.value)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-brown-500 text-xs">Total</span>
            <span className="text-brown-900 text-sm font-bold">{formatCLP(view.total)}</span>
          </div>
          {view.subcategories.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between gap-2">
              <span className="text-brown-700 min-w-0 truncate text-sm">{sub.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  aria-label={`Monto de ${sub.name}`}
                  key={`amt-${sub.id}-${version}`}
                  defaultValue={sub.amount || ""}
                  placeholder="0"
                  autoComplete="off"
                  className="w-24 text-right"
                  onBlur={(e) => handleAmountBlur(sub.id, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => onDeleteSubcategory(category.id, sub.id)}
                  aria-label={`Eliminar ${sub.name}`}
                  className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 cursor-pointer rounded-md border px-1.5 py-0.5 text-xs transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAddSubcategory} className="border-cream-200 flex items-end gap-2 border-t pt-3">
        <Input
          aria-label="Nombre de la subcategoría"
          value={subName}
          placeholder="Nueva subcategoría"
          autoComplete="off"
          onChange={(e) => setSubName(e.target.value)}
        />
        <Select
          aria-label="Bucket de la subcategoría"
          value={subBucket}
          onChange={(e) => setSubBucket(e.target.value as BucketKey)}
          options={BUCKET_ORDER.map((key) => ({ value: key, label: BUCKET_LABELS[key] }))}
        />
        <Button type="submit" variant="secondary">
          Agregar subcategoría
        </Button>
      </form>
    </div>
  );
}

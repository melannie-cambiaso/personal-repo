"use client";

import { useState } from "react";
import type { BucketKey, BudgetCategory, SpendRow } from "@/features/finance-v2/domain";
import { toCategoryView } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { Button, Input, Select } from "@/shared/components";
import { BUCKET_LABELS, BUCKET_ORDER } from "../bucketLabels";
import type { BudgetMode } from "./budgetMode";
import type { SpendView } from "./spendView";
import { SpendPairing, LoadingSpend } from "./SpendPairing";

interface Props {
  mode: BudgetMode;
  category: BudgetCategory;
  spend: SpendView;
  onAmountBlur: (categoryId: string, subcategoryId: string | null, raw: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (categoryId: string, name: string, bucket: BucketKey) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
}

interface AmountFieldProps {
  mode: BudgetMode;
  label: string;
  amount: number;
  className?: string;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Only consulted in view mode (design D8 - spend renders in view mode only).
   *  `undefined` means the month is still loading. */
  spendRow: SpendRow | undefined;
}

// Mode branch written ONCE, consumed by both the leaf cell and every subcategory row —
// avoids duplicating the view/edit split per leaf/parent/sub kind (design decision).
// View mode pairs actual spend against budget (design D4/D8): spent is the primary
// figure, budgeted is the muted suffix — never the plain budgeted-only figure edit
// mode still shows.
function AmountField({ mode, label, amount, className, onBlur, spendRow }: AmountFieldProps) {
  if (mode === "view") {
    return spendRow ? <SpendPairing row={spendRow} /> : <LoadingSpend />;
  }
  return (
    <Input
      type="number"
      min="0"
      aria-label={`Monto de ${label}`}
      defaultValue={amount || ""}
      placeholder="0"
      autoComplete="off"
      className={className}
      onBlur={onBlur}
    />
  );
}

// Branches on `CategoryView.kind` (design decision #2): a leaf gets a direct amount
// input, a parent gets a derived total + one row per subcategory — never both, never
// neither. Modeled on v1's `GroupSection`, one level deeper. Category delete requires
// `window.confirm` (cascade loses every subcategory amount); subcategory delete is
// immediate (design decision #10).
export function BudgetCategoryCard({
  mode,
  category,
  spend,
  onAmountBlur,
  onDeleteCategory,
  onAddSubcategory,
  onDeleteSubcategory,
}: Props) {
  const view = toCategoryView(category);

  // Header row lookup (design D8): a leaf's own id doubles as its `categories` entry
  // (`computeSpendComparison` stores the same row under both `categories` and `leaves`
  // for a childless category). A parent's `categories[id].budgeted` is intentionally 0
  // in the domain (it must never double-count into bucket totals - see
  // `spendRollup.ts`), so the DISPLAYED budgeted figure is paired from `view.total`
  // (already the derived sum `toCategoryView` computes) instead, with only `spent`
  // sourced from the comparison.
  const headerSpendRow: SpendRow | undefined =
    spend.status !== "ready"
      ? undefined
      : view.kind === "leaf"
        ? spend.comparison.categories[category.id]
        : { budgeted: view.total, spent: spend.comparison.categories[category.id].spent };

  // Uncontrolled amount inputs (`defaultValue`) only reflect fresh state on remount, so a
  // counter bumped on every blur forces one.
  const [version, setVersion] = useState(0);
  const [subName, setSubName] = useState("");
  const [subBucket, setSubBucket] = useState<BucketKey>(category.bucket);
  // View-mode-only progressive disclosure: edit mode always shows every subcategory
  // (needed to edit them), view mode starts collapsed behind "Ver más".
  const [subcategoriesExpanded, setSubcategoriesExpanded] = useState(false);

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
        <span className="text-brown-800 min-w-0 truncate text-sm font-semibold">
          {category.name}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {view.kind === "leaf" ? (
            <AmountField
              mode={mode}
              label={category.name}
              amount={view.amount}
              key={`amt-${category.id}-${version}`}
              className="w-24 text-right"
              spendRow={headerSpendRow}
              onBlur={(e) => handleAmountBlur(null, e.target.value)}
            />
          ) : mode === "view" ? (
            headerSpendRow ? <SpendPairing row={headerSpendRow} /> : <LoadingSpend />
          ) : (
            <span className="text-brown-800 text-sm font-bold">{formatCLP(view.total)}</span>
          )}
          {mode === "edit" && (
            <button
              type="button"
              onClick={handleDeleteCategory}
              aria-label={`Eliminar categoría ${category.name}`}
              className="text-2xs text-brown-400 hover:text-red-600 cursor-pointer font-semibold transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {view.kind === "parent" && (
        <div className="flex flex-col gap-2">
          {(mode === "edit" || subcategoriesExpanded) &&
            view.subcategories.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between gap-2">
                <span className="text-brown-700 min-w-0 truncate text-sm">{sub.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <AmountField
                    mode={mode}
                    label={sub.name}
                    amount={sub.amount}
                    key={`amt-${sub.id}-${version}`}
                    className="w-24 text-right"
                    spendRow={spend.status === "ready" ? spend.comparison.leaves[sub.id] : undefined}
                    onBlur={(e) => handleAmountBlur(sub.id, e.target.value)}
                  />
                  {mode === "edit" && (
                    <button
                      type="button"
                      onClick={() => onDeleteSubcategory(category.id, sub.id)}
                      aria-label={`Eliminar ${sub.name}`}
                      className="border-cream-400 text-brown-500 hover:border-brown-600 hover:text-brown-800 cursor-pointer rounded-md border px-1.5 py-0.5 text-xs transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          {mode === "view" && (
            <button
              type="button"
              aria-expanded={subcategoriesExpanded}
              onClick={() => setSubcategoriesExpanded((v) => !v)}
              className="text-2xs text-brown-500 hover:text-brown-800 cursor-pointer self-start font-semibold transition-colors"
            >
              {subcategoriesExpanded ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>
      )}

      {mode === "edit" && (
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
      )}
    </div>
  );
}

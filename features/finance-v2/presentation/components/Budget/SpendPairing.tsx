import type { SpendRow } from "@/features/finance-v2/domain";
import { isOverrun } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  row: SpendRow;
}

// Shared D4 idiom: the spent amount is the primary bold figure, followed by a
// short suffix saying where it stands against the budget. The budgeted amount
// itself is not shown — the suffix already carries the one figure that drives a
// decision, and repeating the budget made the rows too dense. Reused by
// `BucketComparison` (bucket rows/total) and `BudgetCategoryCard`
// (leaf/subcategory/parent-derived rows) so the strict `isOverrun` rule and its
// visual treatment live in exactly one place.
export function SpendPairing({ row }: Props) {
  const overrun = isOverrun(row);
  const remaining = row.budgeted - row.spent;
  // The excess and the remainder are spelled out, not left as a subtraction for
  // the reader to work out: the excess says how much to cut, the remainder how
  // much is left to spend. An exactly-spent row (including an empty "0 de 0") has
  // neither, so it gets no suffix element at all.
  const suffix = overrun
    ? `excedido en ${formatCLP(row.spent - row.budgeted)}`
    : remaining > 0
      ? `quedan ${formatCLP(remaining)}`
      : null;
  return (
    <span
      className={overrun ? "text-sm font-bold text-red-600" : "text-sm font-bold text-green-700"}
    >
      {formatCLP(row.spent)}
      {suffix && (
        <span
          className={`text-2xs ml-1 font-normal ${overrun ? "text-red-600" : "text-brown-400"}`}
        >
          {suffix}
        </span>
      )}
    </span>
  );
}

// Design D7: a false "$0" is worse than no number, so the loading state never
// renders a figure — just the muted placeholder, everywhere a `SpendPairing`
// would otherwise go.
export function LoadingSpend() {
  return <span className="text-2xs text-brown-400 font-normal">—</span>;
}

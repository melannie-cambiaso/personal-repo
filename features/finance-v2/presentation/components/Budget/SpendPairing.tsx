import type { SpendRow } from "@/features/finance-v2/domain";
import { isOverrun } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  row: SpendRow;
}

// Shared D4 idiom: the spent amount is the primary bold figure, the budgeted
// amount is the muted "de ..." suffix — the exact `formatCLP(budgeted)` / `de
// {formatCLP(target)}` shape `BucketComparison`'s budgeted/target pairing already
// uses, inverted. Reused by `BucketComparison` (bucket rows/total) and
// `BudgetCategoryCard` (leaf/subcategory/parent-derived rows) so the strict
// `isOverrun` rule and its visual treatment live in exactly one place.
export function SpendPairing({ row }: Props) {
  const overrun = isOverrun(row);
  return (
    <span className={overrun ? "text-red-600 text-sm font-bold" : "text-green-700 text-sm font-bold"}>
      {formatCLP(row.spent)}
      <span className={`text-2xs ml-1 font-normal ${overrun ? "text-red-600" : "text-brown-400"}`}>
        de {formatCLP(row.budgeted)}
        {/* The excess is spelled out, not left as "spent minus budgeted" for the
            reader to work out: it is the one figure that says how much to cut, and
            both numbers it comes from are already on screen beside it. */}
        {overrun && ` · excedido en ${formatCLP(row.spent - row.budgeted)}`}
      </span>
    </span>
  );
}

// Design D7: a false "$0" is worse than no number, so the loading state never
// renders a figure — just the muted placeholder, everywhere a `SpendPairing`
// would otherwise go.
export function LoadingSpend() {
  return <span className="text-2xs text-brown-400 font-normal">—</span>;
}

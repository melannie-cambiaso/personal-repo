import type { TransactionTotals } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  totals: TransactionTotals;
}

// Balance is `income - expense - savings` (savings leaves the account like an expense).
// The breakdown sub-line renders those three INPUT terms so the figures reconcile with
// the Balance above them; it never recomputes the arithmetic — that lives in
// computeTransactionTotals. The standalone "Ahorro" row stays as its own plain monthly
// sum, which is why the savings figure intentionally appears twice in this tree.
// Still no comparison against tab 1's savings target.
export function MovementSummary({ totals }: Props) {
  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-brown-500 text-sm">Balance</span>
          <span className="text-brown-800 text-sm font-bold">{formatCLP(totals.balance)}</span>
        </div>
        <div className="flex items-center justify-end gap-1 text-xs">
          <span className="text-green-700 font-bold">{formatCLP(totals.income)}</span>
          <span className="text-brown-400">−</span>
          <span className="text-red-700 font-bold">{formatCLP(totals.expense)}</span>
          <span className="text-brown-400">−</span>
          <span className="text-amber-700 font-bold">{formatCLP(totals.savings)}</span>
        </div>
      </div>
      <div className="border-cream-300 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-brown-500 text-sm">Ahorro</span>
        <span className="text-brown-800 text-sm font-bold">{formatCLP(totals.savings)}</span>
      </div>
    </div>
  );
}

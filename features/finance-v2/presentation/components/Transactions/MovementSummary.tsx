import type { TransactionTotals } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  totals: TransactionTotals;
  hasEnvelope: boolean;
}

// Balance is `income - expense - savings - transfer` (savings and transfers leave the
// account like an expense; `expense` is main-account only — envelope-paid bills are
// already covered by the transfer). With no envelope `transfer` is always 0, so neither
// its segment nor its row is rendered: the UI stays exactly as before (spec).
// The breakdown sub-line renders those INPUT terms so the figures reconcile with
// the Balance above them; it never recomputes the arithmetic — that lives in
// computeTransactionTotals. The standalone "Ahorro" row stays as its own plain monthly
// sum, which is why the savings figure intentionally appears twice in this tree.
// Still no comparison against tab 1's savings target.
export function MovementSummary({ totals, hasEnvelope }: Props) {
  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-brown-500 text-sm">Balance</span>
          <span className="text-brown-800 text-sm font-bold">{formatCLP(totals.balance)}</span>
        </div>
        <div className="flex items-center justify-end gap-1 text-xs">
          <span className="font-bold text-green-700">{formatCLP(totals.income)}</span>
          <span className="text-brown-400">−</span>
          <span className="font-bold text-red-700">{formatCLP(totals.expense)}</span>
          <span className="text-brown-400">−</span>
          <span className="font-bold text-amber-700">{formatCLP(totals.savings)}</span>
          {hasEnvelope && (
            <>
              <span className="text-brown-400">−</span>
              <span className="font-bold text-sky-700">{formatCLP(totals.transfer)}</span>
            </>
          )}
        </div>
      </div>
      <div className="border-cream-300 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-brown-500 text-sm">Ahorro</span>
        <span className="text-brown-800 text-sm font-bold">{formatCLP(totals.savings)}</span>
      </div>
      {hasEnvelope && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-brown-500 text-sm">Transferencias</span>
          <span className="text-brown-800 text-sm font-bold">{formatCLP(totals.transfer)}</span>
        </div>
      )}
    </div>
  );
}

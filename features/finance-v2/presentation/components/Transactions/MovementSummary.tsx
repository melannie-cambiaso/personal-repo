import type { TransactionTotals } from "@/features/finance-v2/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  totals: TransactionTotals;
}

// Balance (`income - expense`) and savings are ALWAYS two separate rows — savings
// never contributes to balance (spec: Balance and Savings Totals Are Separate), and
// there is no comparison against tab 1's savings target (locked scope).
export function MovementSummary({ totals }: Props) {
  return (
    <div className="border-cream-300 flex flex-col gap-3 rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-500 text-sm">Balance</span>
        <span className="text-brown-800 text-sm font-bold">{formatCLP(totals.balance)}</span>
      </div>
      <div className="border-cream-300 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-brown-500 text-sm">Ahorro</span>
        <span className="text-brown-800 text-sm font-bold">{formatCLP(totals.savings)}</span>
      </div>
    </div>
  );
}

import Link from "next/link";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  balance: number;
  toReplenish: number;
}

// The home page's glance at savings: the active period's balance and amount to
// replenish, the same figures as the `/savings` summary, with a link into the full
// page. Styled as a sibling of `FinanceSummaryCard` and `WishlistSummaryCard`.
export function SavingsSummaryCard({ balance, toReplenish }: Props) {
  // Same balance colors as `SavingsSummaryCards` on `/savings`.
  const balanceColor =
    balance > 0 ? "text-green-700" : balance < 0 ? "text-red-600" : "text-brown-600";

  return (
    <div className="border-butter-300 bg-butter-100 flex flex-col gap-4 rounded-3xl border-2 p-5 text-left">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-butter-500 flex size-10 shrink-0 items-center justify-center rounded-full text-xl"
        >
          💰
        </span>
        <h2 className="text-brown-900 text-2xl">
          Ahorros
        </h2>
      </div>
      <div className="border-butter-300 bg-cream-50/70 flex flex-col gap-2 rounded-2xl border-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-brown-600">Balance</span>
          <span className={`font-figure text-sm font-semibold ${balanceColor}`}>
            {formatCLP(balance)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-brown-600">A reponer</span>
          <span className="font-figure text-blush-800 text-sm font-semibold">
            {formatCLP(toReplenish)}
          </span>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <Link
          href="/savings"
          className="bg-butter-300 text-butter-800 hover:bg-butter-500 rounded-full px-3 py-0.5 transition-colors"
        >
          Ver más →
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { formatMonth } from "@/shared/utils/formatMonth";

interface Props {
  month: string;
  balance: number;
  pending: number;
}

// The home page's glance at the current month: the same balance / pending figures
// and surplus-or-shortfall line as the Budget tab's `AccountCoverage`, with a link
// into the full dashboard.
export function FinanceSummaryCard({ month, balance, pending }: Props) {
  const diff = balance - pending;

  return (
    <div className="border-sage-300 bg-sage-100 flex flex-col gap-4 rounded-3xl border-2 p-5 text-left">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-sage-500 flex size-10 shrink-0 items-center justify-center rounded-full text-xl"
        >
          💸
        </span>
        <h2 className="text-brown-900 text-2xl font-semibold tracking-tight">
          Finanzas · {formatMonth(month)}
        </h2>
      </div>
      <div className="border-sage-300 bg-cream-50/70 flex flex-col gap-2 rounded-2xl border-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-brown-600">Balance del mes</span>
          <span className="font-figure text-brown-900 text-sm font-semibold">
            {formatCLP(balance)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-brown-600">Pendiente por pagar</span>
          <span className="font-figure text-brown-900 text-sm font-semibold">
            {formatCLP(pending)}
          </span>
        </div>
      </div>
      {/* `mt-auto` pins the footer to the bottom when a taller sibling card stretches
          this one in the home grid. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/finance-v2"
          className="bg-sage-300 text-sage-800 hover:bg-sage-500 rounded-full px-3 py-0.5 transition-colors"
        >
          Ver más →
        </Link>
        {diff >= 0 ? (
          <span className="font-figure text-sm font-semibold text-green-700">
            Te sobran {formatCLP(diff)}
          </span>
        ) : (
          <span className="font-figure text-sm font-semibold text-red-600">
            Te faltan {formatCLP(-diff)}
          </span>
        )}
      </div>
    </div>
  );
}

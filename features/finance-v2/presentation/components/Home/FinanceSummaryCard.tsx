import { formatCLP } from "@/shared/utils/formatCurrency";
import { formatMonth } from "@/shared/utils/formatMonth";

interface Props {
  month: string;
  balance: number;
  pending: number;
}

// The home page's glance at the current month: the same balance / pending figures
// and surplus-or-shortfall line as the Budget tab's `AccountCoverage`. The full
// dashboard is reached from the app sidebar.
export function FinanceSummaryCard({ month, balance, pending }: Props) {
  const diff = balance - pending;

  return (
    <div className="border-surface-300 bg-surface-50 flex flex-col gap-4 rounded-3xl border-2 p-5 text-left">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-surface-200 flex size-10 shrink-0 items-center justify-center rounded-full text-xl"
        >
          💸
        </span>
        <h2 className="text-ink-900 text-2xl">Finanzas · {formatMonth(month)}</h2>
      </div>
      <div className="border-surface-300 bg-surface-100 flex flex-col gap-2 rounded-2xl border-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-600">Balance del mes</span>
          <span className="font-figure text-ink-900 text-sm font-semibold">
            {formatCLP(balance)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-600">Pendiente por pagar</span>
          <span className="font-figure text-ink-900 text-sm font-semibold">
            {formatCLP(pending)}
          </span>
        </div>
      </div>
      {/* `mt-auto` pins the footer to the bottom when a taller sibling card stretches
          this one in the home grid. */}
      <div className="mt-auto flex flex-wrap items-center justify-end gap-2">
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

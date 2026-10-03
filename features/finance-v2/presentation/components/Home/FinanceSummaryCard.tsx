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
    <div className="border-cream-300 flex flex-col gap-3 rounded-2xl border bg-white p-5 text-left shadow-sm">
      <span className="font-dancing text-brown-900 text-2xl font-bold">
        Finanzas · {formatMonth(month)}
      </span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-500 text-sm">Balance del mes</span>
        <span className="text-brown-800 text-sm font-bold">{formatCLP(balance)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-brown-500 text-sm">Pendiente por pagar</span>
        <span className="text-brown-800 text-sm font-bold">{formatCLP(pending)}</span>
      </div>
      {/* `mt-auto` pins the footer to the bottom when a taller sibling card stretches
          this one in the home grid. */}
      <div className="border-cream-300 mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <Link href="/finance-v2" className="text-brown-500 hover:text-brown-800 text-sm">
          Ver más →
        </Link>
        {diff >= 0 ? (
          <span className="text-sm font-bold text-green-700">Te sobran {formatCLP(diff)}</span>
        ) : (
          <span className="text-sm font-bold text-red-600">Te faltan {formatCLP(-diff)}</span>
        )}
      </div>
    </div>
  );
}

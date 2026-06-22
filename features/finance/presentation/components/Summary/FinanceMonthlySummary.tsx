"use client";

import type { FinanceSummary } from "@/features/finance/domain/FinanceEntry";

interface Props {
  summary: FinanceSummary;
}

export function FinanceMonthlySummary({ summary }: Props) {
  const { totalIncome, totalExpenses, net, byGroup } = summary;
  const fmt = (n: number) => `$${n.toLocaleString("es-AR")}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-cream-300 bg-white p-4 text-center">
          <p className="mb-1 text-2xs font-semibold uppercase tracking-wide text-brown-400">Ingresos</p>
          <p className="text-lg font-bold text-green-600">{fmt(totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-cream-300 bg-white p-4 text-center">
          <p className="mb-1 text-2xs font-semibold uppercase tracking-wide text-brown-400">Gastos</p>
          <p className="text-lg font-bold text-red-500">{fmt(totalExpenses)}</p>
        </div>
        <div className="rounded-xl border border-cream-300 bg-white p-4 text-center">
          <p className="mb-1 text-2xs font-semibold uppercase tracking-wide text-brown-400">Balance</p>
          <p className={`text-lg font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(net)}</p>
        </div>
      </div>

      {byGroup.size > 0 && (
        <div className="rounded-xl border border-cream-300 bg-white p-4">
          <p className="mb-3 text-2xs font-semibold uppercase tracking-wide text-brown-400">Por grupo</p>
          <ul className="divide-y divide-cream-200">
            {[...byGroup.entries()].map(([group, amount]) => (
              <li key={group} className="flex items-center justify-between py-2">
                <span className="text-sm text-brown-700">{group}</span>
                <span className="text-sm font-semibold text-brown-900">{fmt(amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

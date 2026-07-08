"use client";

import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { groupEntriesByMonth } from "@/features/savings/domain/groupEntriesByMonth";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { formatMonth } from "@/shared/utils/formatMonth";

interface Props {
  entries: SavingsEntry[];
}

export function MonthlyBreakdown({ entries }: Props) {
  const groups = groupEntriesByMonth(entries);

  if (groups.length === 0) {
    return (
      <div className="text-brown-400 py-16 text-center">
        <p className="mb-1 text-4xl">📅</p>
        <p className="text-sm">Sin registros todavía.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div
          key={group.month}
          className="border-cream-300 rounded-2xl border bg-white px-5 py-4 shadow-sm"
        >
          <h3 className="text-brown-900 mb-3 text-sm font-semibold capitalize">
            {formatMonth(group.month)}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-2xs tracking-store text-brown-400 mb-1 font-semibold uppercase">
                Depositado
              </p>
              <p className="text-sm font-bold text-green-700">{formatCLP(group.totalDepositos)}</p>
            </div>
            <div>
              <p className="text-2xs tracking-store text-brown-400 mb-1 font-semibold uppercase">
                Gastado
              </p>
              <p className="text-sm font-bold text-red-700">{formatCLP(group.totalGastos)}</p>
            </div>
            <div>
              <p className="text-2xs tracking-store text-brown-400 mb-1 font-semibold uppercase">
                Neto
              </p>
              <p className="text-sm font-bold text-brown-900">{formatCLP(group.net)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

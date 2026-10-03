"use client";

import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { groupEntriesByMonth } from "@/features/savings/domain/groupEntriesByMonth";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { formatMonth } from "@/shared/utils/formatMonth";

interface Props {
  entries: SavingsEntry[];
}

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-brown-600">{label}</span>
      <span className={`font-figure shrink-0 text-sm font-bold ${tone}`}>{value}</span>
    </div>
  );
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
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div
          key={group.month}
          className="border-butter-300 bg-butter-100 flex flex-col gap-3 rounded-3xl border-2 p-4"
        >
          <h3 className="font-dancing text-brown-900 underline-wavy decoration-butter-500 text-xl capitalize">
            {formatMonth(group.month)}
          </h3>
          <div className="border-butter-300 bg-cream-50/70 flex flex-col gap-2 rounded-2xl border-2 px-4 py-3">
            <Row label="Depositado" value={formatCLP(group.totalDepositos)} tone="text-green-700" />
            <Row label="Gastado" value={formatCLP(group.totalGastos)} tone="text-red-700" />
            <div className="border-butter-300 border-t-2 border-dashed pt-2">
              <Row label="Neto" value={formatCLP(group.net)} tone="text-brown-900" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

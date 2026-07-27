"use client";

import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import type { SavingsPeriod } from "@/features/savings/domain/SavingsPeriod";
import { selectPeriodEntries } from "@/features/savings/domain/SavingsPeriod";
import { computeTotalToReplenish } from "@/features/savings/domain/computeTotalToReplenish";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { SavingsEntryList } from "../List/SavingsEntryList";

interface Props {
  periods: SavingsPeriod[];
  entries: SavingsEntry[];
}

const noop = () => {};

function formatPeriodRange(period: SavingsPeriod): string {
  if (period.label) return period.label;
  const start = new Date(period.startedAt).toLocaleDateString("es-CL");
  const end = period.closedAt ? new Date(period.closedAt).toLocaleDateString("es-CL") : "hoy";
  return `${start} / ${end}`;
}

export function ArchivedPeriodList({ periods, entries }: Props) {
  const closedPeriods = periods
    .filter((p) => p.closedAt)
    .sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? ""));

  if (closedPeriods.length === 0) {
    return (
      <div className="text-brown-400 py-16 text-center">
        <p className="mb-1 text-4xl">🗄️</p>
        <p className="text-sm">Todavía no archivaste ningún período.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {closedPeriods.map((period) => {
        const periodEntries = selectPeriodEntries(entries, period.id);
        const toReplenish = computeTotalToReplenish(periodEntries);

        return (
          <div
            key={period.id}
            className="border-cream-300 rounded-2xl border bg-white px-5 py-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-brown-900 text-sm font-semibold">
                {formatPeriodRange(period)}
              </h3>
              <div className="flex items-center gap-2">
                {period.initialAmount > 0 && (
                  <span className="text-2xs text-brown-400 font-semibold">
                    Monto inicial: {formatCLP(period.initialAmount)}
                  </span>
                )}
                {toReplenish > 0 && (
                  <span className="text-2xs rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                    Pendiente de reponer: {formatCLP(toReplenish)}
                  </span>
                )}
              </div>
            </div>
            <SavingsEntryList
              entries={periodEntries}
              isOwner={false}
              onEdit={noop}
              onMarkReplenished={noop}
              onDelete={noop}
            />
          </div>
        );
      })}
    </div>
  );
}

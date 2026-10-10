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
            className="flex flex-col gap-3 rounded-3xl border-2 border-mist-300 bg-mist-100 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-brown-900 min-w-0 text-xl break-words">
                {formatPeriodRange(period)}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {period.initialAmount > 0 && (
                  <span className="font-figure rounded-full bg-mist-300 px-2 py-0.5 text-xs text-mist-800">
                    Monto inicial: {formatCLP(period.initialAmount)}
                  </span>
                )}
                {toReplenish > 0 && (
                  <span className="font-figure bg-blush-300 text-blush-800 rounded-full px-2 py-0.5 text-xs">
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

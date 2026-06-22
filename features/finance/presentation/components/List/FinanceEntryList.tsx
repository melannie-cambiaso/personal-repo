"use client";

import type { FinanceEntry } from "@/features/finance/domain/FinanceEntry";
import { FinanceEntryCard } from "./FinanceEntryCard";

interface Props {
  groupedByDay: Map<string, FinanceEntry[]>;
  isOwner: boolean;
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (id: string) => void;
}

function formatDayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function FinanceEntryList({ groupedByDay, isOwner, onEdit, onDelete }: Props) {
  if (groupedByDay.size === 0) {
    return (
      <p className="py-12 text-center text-sm text-brown-400">
        No hay registros este mes.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {[...groupedByDay.entries()].map(([date, entries]) => (
        <div key={date}>
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wide capitalize text-brown-400">
            {formatDayLabel(date)}
          </p>
          <div className="divide-y divide-cream-200 rounded-xl border border-cream-300 bg-white px-4">
            {entries.map((entry) => (
              <FinanceEntryCard
                key={entry.id}
                entry={entry}
                isOwner={isOwner}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

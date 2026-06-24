"use client";

import type { ActivityLogEntry } from "@/features/activity-log/domain";
import { groupByDay } from "@/features/activity-log/domain";
import { ActivityLogEntryCard } from "../ActivityLogEntryCard/ActivityLogEntryCard";

interface Props {
  entries: ActivityLogEntry[];
  onDelete: (id: string) => void;
}

const dateFormatter = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDateHeader(dateStr: string): string {
  // Parse as local noon to avoid timezone shifts
  const date = new Date(`${dateStr}T12:00:00`);
  return dateFormatter.format(date);
}

export function ActivityLogList({ entries, onDelete }: Props) {
  const grouped = groupByDay(entries);
  const days = Object.keys(grouped);

  if (days.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-brown-400">
        No hay actividades para este mes.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {days.map((day) => (
        <section key={day}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brown-400 capitalize">
            {formatDateHeader(day)}
          </h3>
          <div className="flex flex-col gap-3">
            {grouped[day]!.map((entry) => (
              <ActivityLogEntryCard
                key={entry.id}
                entry={entry}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

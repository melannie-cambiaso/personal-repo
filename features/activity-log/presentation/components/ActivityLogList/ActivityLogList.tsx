"use client";

import type { ActivityLogEntry } from "@/features/activity-log/domain";
import { groupByDay, groupByPerson, isToday } from "@/features/activity-log/domain";
import { ActivityLogEntryCard } from "../ActivityLogEntryCard/ActivityLogEntryCard";
import { ActivityLogPersonGroup } from "../ActivityLogPersonGroup/ActivityLogPersonGroup";

interface Props {
  entries: ActivityLogEntry[];
  onDelete: (id: string) => void;
  selectedMonth: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
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

export function ActivityLogList({ entries, onDelete, selectedMonth }: Props) {
  const grouped = groupByDay(entries);
  const days = Object.keys(grouped);

  if (days.length === 0) {
    return (
      <p className="text-brown-400 py-12 text-center text-sm">No hay actividades para este mes.</p>
    );
  }

  return (
    <div key={selectedMonth} className="flex flex-col gap-8">
      {days.map((day) => (
        <section key={day}>
          <h3 className="text-brown-400 mb-3 text-xs font-semibold tracking-wider capitalize uppercase">
            {formatDateHeader(day)}
          </h3>

          {isToday(day) ? (
            <div className="flex flex-col gap-3">
              {grouped[day]!.map((entry) => (
                <ActivityLogEntryCard key={entry.id} entry={entry} onDelete={onDelete} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {(() => {
                const byPerson = groupByPerson(grouped[day]!);
                return Object.keys(byPerson)
                  .sort()
                  .map((person) => (
                    <ActivityLogPersonGroup
                      key={person}
                      person={person as ActivityLogEntry["person"]}
                      entries={byPerson[person as ActivityLogEntry["person"]]!}
                      onDelete={onDelete}
                    />
                  ));
              })()}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

"use client";

import type { ActivityLogEntry } from "@/features/activity-log/domain";

interface Props {
  entry: ActivityLogEntry;
  onDelete: (id: string) => void;
}

const personBadge: Record<string, string> = {
  Meme: "bg-pink-100 text-pink-700",
  Pedro: "bg-blue-100 text-blue-700",
};

export function ActivityLogEntryCard({ entry, onDelete }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-cream-300 bg-white px-5 py-4 shadow-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${personBadge[entry.person] ?? "bg-cream-100 text-brown-600"}`}
          >
            {entry.person}
          </span>
        </div>
        <p className="text-sm text-brown-900">{entry.activity}</p>
        {entry.notes && (
          <p className="text-xs text-brown-400">{entry.notes}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(entry.id)}
        className="cursor-pointer text-sm text-brown-300 transition-colors hover:text-red-500"
        aria-label="Eliminar"
      >
        ✕
      </button>
    </div>
  );
}

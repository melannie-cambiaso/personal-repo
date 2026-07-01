"use client";

import { useState } from "react";
import type { ActivityLogEntry, Person } from "@/features/activity-log/domain";
import { ActivityLogEntryCard } from "../ActivityLogEntryCard/ActivityLogEntryCard";

interface Props {
  person: Person;
  entries: ActivityLogEntry[];
  onDelete: (id: string) => void;
}

export function ActivityLogPersonGroup({ person, entries, onDelete }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleEntries = isExpanded ? entries : entries.slice(0, 3);
  const hiddenCount = entries.length - 3;
  const hasToggle = entries.length > 3;

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2 flex items-center gap-2">
        <h4 className="text-brown-700 text-sm font-semibold">{person}</h4>
        <span className="bg-cream-100 text-2xs text-brown-600 rounded-full px-2 py-0.5 font-semibold">
          {entries.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {visibleEntries.map((entry) => (
          <ActivityLogEntryCard key={entry.id} entry={entry} onDelete={onDelete} />
        ))}
      </div>

      {hasToggle && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-brown-400 hover:text-brown-700 mt-1 cursor-pointer text-left text-xs transition-colors"
        >
          {isExpanded ? "Ver menos" : `Ver más (${hiddenCount})`}
        </button>
      )}
    </div>
  );
}

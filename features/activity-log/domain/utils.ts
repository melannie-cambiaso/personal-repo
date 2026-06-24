import type { ActivityLogEntry } from "./ActivityLogEntry";

export function groupByDay(
  entries: ActivityLogEntry[],
): Record<string, ActivityLogEntry[]> {
  const groups: Record<string, ActivityLogEntry[]> = {};
  for (const entry of entries) {
    (groups[entry.date] ??= []).push(entry);
  }
  // Sort keys descending — YYYY-MM-DD string comparison is safe
  return Object.fromEntries(
    Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)),
  );
}

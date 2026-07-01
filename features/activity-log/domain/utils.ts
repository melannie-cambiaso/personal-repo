import type { ActivityLogEntry, Person } from "./ActivityLogEntry";

export function groupByDay(entries: ActivityLogEntry[]): Record<string, ActivityLogEntry[]> {
  const groups: Record<string, ActivityLogEntry[]> = {};
  for (const entry of entries) {
    (groups[entry.date] ??= []).push(entry);
  }
  // Sort keys descending — YYYY-MM-DD string comparison is safe
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)));
}

export function isToday(dateStr: string): boolean {
  return new Date().toISOString().slice(0, 10) === dateStr;
}

export function groupByPerson(
  entries: ActivityLogEntry[]
): Partial<Record<Person, ActivityLogEntry[]>> {
  const groups: Partial<Record<Person, ActivityLogEntry[]>> = {};
  for (const entry of entries) {
    (groups[entry.person] ??= []).push(entry);
  }
  return groups;
}

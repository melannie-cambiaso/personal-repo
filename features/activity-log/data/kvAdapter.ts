import "server-only";
import { redis } from "@/shared/kv";
import type { ActivityLogEntry } from "../domain/ActivityLogEntry";

const entryKey = (month: string) => `activity-log:${month}`;

export async function loadEntries(month: string): Promise<ActivityLogEntry[]> {
  try {
    return (await redis.get<ActivityLogEntry[]>(entryKey(month))) ?? [];
  } catch {
    return [];
  }
}

export async function saveEntries(month: string, entries: ActivityLogEntry[]): Promise<void> {
  try {
    await redis.set(entryKey(month), entries);
  } catch (e) {
    console.error("activity-log.saveEntries failed", e);
  }
}

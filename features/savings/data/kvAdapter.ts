import "server-only";
import { redis } from "@/shared/kv";
import type { SavingsEntry } from "../domain/SavingsEntry";

const ENTRIES_KEY = "savings-entries";

export async function loadEntries(): Promise<SavingsEntry[]> {
  try {
    return (await redis.get<SavingsEntry[]>(ENTRIES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: SavingsEntry[]): Promise<void> {
  try {
    const sanitized = entries.map((e) =>
      e.type === "deposito" ? { ...e, toReplenish: false } : e,
    );
    await redis.set(ENTRIES_KEY, sanitized);
  } catch (e) {
    console.error("savings.saveEntries failed", e);
  }
}

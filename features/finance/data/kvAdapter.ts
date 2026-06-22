import "server-only";
import { redis } from "@/shared/kv";
import type { FinanceEntry } from "../domain/FinanceEntry";

const ENTRIES_KEY = "finance-entries";

export async function loadEntries(): Promise<FinanceEntry[]> {
  try {
    return (await redis.get<FinanceEntry[]>(ENTRIES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: FinanceEntry[]): Promise<void> {
  try {
    await redis.set(ENTRIES_KEY, entries);
  } catch (e) {
    console.error("finance.saveEntries failed", e);
  }
}

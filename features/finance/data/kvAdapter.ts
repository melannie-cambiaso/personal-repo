import "server-only";
import { redis } from "@/shared/kv";
import type { FinanceEntry } from "../domain/FinanceEntry";

const ENTRIES_KEY = "finance-entries";
const budgetKey = (month: string) => `finance-budget:${month}`;

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

export async function loadBudget(month: string): Promise<Record<string, number>> {
  try {
    return (await redis.get<Record<string, number>>(budgetKey(month))) ?? {};
  } catch {
    return {};
  }
}

export async function saveBudget(month: string, budget: Record<string, number>): Promise<void> {
  try {
    await redis.set(budgetKey(month), budget);
  } catch (e) {
    console.error("finance.saveBudget failed", e);
  }
}

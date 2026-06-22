import "server-only";
import { redis } from "@/shared/kv";
import type { FinanceEntry } from "../domain/FinanceEntry";

const ENTRIES_KEY = "finance-entries";
const budgetKey = (month: string) => `finance-budget:${month}`;

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, "0")}`;
}

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
    const current = await redis.get<Record<string, number>>(budgetKey(month));
    if (current) return current;
    return (await redis.get<Record<string, number>>(budgetKey(prevMonth(month)))) ?? {};
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

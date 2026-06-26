import "server-only";
import { redis } from "@/shared/kv";
import { DEFAULT_GROUPS } from "@/features/finance/domain";
import type { FinanceTransaction } from "@/features/finance/domain";

export type Group = { name: string; type: "income" | "expense"; categories: string[] }

const CATEGORIES_KEY = "finance-categories";

const budgetKey = (month: string) => `finance-budget:${month}`;

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

const actualKey = (month: string) => `finance-actual:${month}`;

export async function loadActual(month: string): Promise<Record<string, number>> {
  try {
    return (await redis.get<Record<string, number>>(actualKey(month))) ?? {};
  } catch {
    return {};
  }
}

export async function saveActual(month: string, actual: Record<string, number>): Promise<void> {
  try {
    await redis.set(actualKey(month), actual);
  } catch (e) {
    console.error("finance.saveActual failed", e);
  }
}

export async function loadCategories(): Promise<Group[]> {
  try {
    const stored = await redis.get<Group[]>(CATEGORIES_KEY);
    if (!stored || stored.length === 0) {
      return DEFAULT_GROUPS;
    }
    return stored;
  } catch {
    return DEFAULT_GROUPS;
  }
}

export async function saveCategories(groups: Group[]): Promise<void> {
  try {
    await redis.set(CATEGORIES_KEY, groups);
  } catch {
    // ponytail: swallow — caller has no recovery path; categories revert to in-memory state on next load
  }
}

const transactionsKey = (month: string) => `finance-transactions:${month}`;

export async function loadTransactions(month: string): Promise<FinanceTransaction[]> {
  try {
    return (await redis.get<FinanceTransaction[]>(transactionsKey(month))) ?? [];
  } catch {
    return [];
  }
}

export async function saveTransactions(month: string, txs: FinanceTransaction[]): Promise<void> {
  try {
    await redis.set(transactionsKey(month), txs);
  } catch (e) {
    console.error("finance.saveTransactions failed", e);
  }
}

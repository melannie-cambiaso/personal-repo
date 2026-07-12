import "server-only";
import { redis } from "@/shared/kv";
import { DEFAULT_GROUPS } from "@/features/finance/domain";
import type { FinanceTransaction, BudgetUnitConfig } from "@/features/finance/domain";

export type Group = { name: string; type: "income" | "expense" | "refund"; categories: string[] };

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

const budgetUnitConfigKey = (month: string) => `finance-budget-unit-config:${month}`;

export async function loadBudgetUnitConfig(month: string): Promise<BudgetUnitConfig> {
  try {
    return (await redis.get<BudgetUnitConfig>(budgetUnitConfigKey(month))) ?? {};
  } catch {
    return {};
  }
}

export async function saveBudgetUnitConfig(
  month: string,
  config: BudgetUnitConfig
): Promise<void> {
  try {
    await redis.set(budgetUnitConfigKey(month), config);
  } catch (e) {
    console.error("finance.saveBudgetUnitConfig failed", e);
  }
}

export async function loadCategories(): Promise<Group[]> {
  try {
    const stored = await redis.get<Group[]>(CATEGORIES_KEY);
    if (!stored || stored.length === 0) {
      return DEFAULT_GROUPS;
    }
    return stored.map((g) =>
      g.name === "Devolución" && g.type === "income" ? { ...g, type: "refund" as const } : g
    );
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

const closedCategoriesKey = (month: string) => `finance-closed-categories:${month}`;

export async function loadClosedCategories(month: string): Promise<string[]> {
  try {
    return (await redis.get<string[]>(closedCategoriesKey(month))) ?? [];
  } catch {
    return [];
  }
}

export async function saveClosedCategories(month: string, categories: string[]): Promise<void> {
  try {
    await redis.set(closedCategoriesKey(month), categories);
  } catch (e) {
    console.error("finance.saveClosedCategories failed", e);
  }
}

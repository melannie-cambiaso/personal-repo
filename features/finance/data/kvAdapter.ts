import "server-only";
import { redis } from "@/shared/kv";
import { DEFAULT_GROUPS } from "@/features/finance/domain";
import type { FinanceTransaction, BudgetUnitConfig } from "@/features/finance/domain";

export type Group = { name: string; type: "income" | "expense" | "refund"; categories: string[] };

const CATEGORIES_KEY = "finance-categories";

// ponytail: 4 monthly-keyed stores share this exact load/save-with-default shape; a 5th one
// should extend this factory instead of copy-pasting another try/catch pair.
function monthlyKvStore<T>(prefix: string, label: string, defaultValue: () => T) {
  const key = (month: string) => `${prefix}:${month}`;
  return {
    load: async (month: string): Promise<T> => {
      try {
        return (await redis.get<T>(key(month))) ?? defaultValue();
      } catch {
        return defaultValue();
      }
    },
    save: async (month: string, value: T): Promise<void> => {
      try {
        await redis.set(key(month), value);
      } catch (e) {
        console.error(`finance.save${label} failed`, e);
      }
    },
  };
}

const budgetStore = monthlyKvStore<Record<string, number>>("finance-budget", "Budget", () => ({}));
export const loadBudget = budgetStore.load;
export const saveBudget = budgetStore.save;

const budgetUnitConfigStore = monthlyKvStore<BudgetUnitConfig>(
  "finance-budget-unit-config",
  "BudgetUnitConfig",
  () => ({})
);
export const loadBudgetUnitConfig = budgetUnitConfigStore.load;
export const saveBudgetUnitConfig = budgetUnitConfigStore.save;

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

const transactionsStore = monthlyKvStore<FinanceTransaction[]>(
  "finance-transactions",
  "Transactions",
  () => []
);
export const loadTransactions = transactionsStore.load;
export const saveTransactions = transactionsStore.save;

const closedCategoriesStore = monthlyKvStore<string[]>(
  "finance-closed-categories",
  "ClosedCategories",
  () => []
);
export const loadClosedCategories = closedCategoriesStore.load;
export const saveClosedCategories = closedCategoriesStore.save;

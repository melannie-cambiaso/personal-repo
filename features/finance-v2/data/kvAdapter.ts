import "server-only";
import { redis } from "@/shared/kv";
import { DEFAULT_BUDGET_CONFIG } from "@/features/finance-v2/domain";
import type { BudgetConfig, FinanceV2Transaction } from "@/features/finance-v2/domain";

// Global, not month-scoped, distinct from all v1 finance keys — same try/catch-swallow
// + default-on-miss pattern.
const BUDGET_CONFIG_KEY = "finance-v2-budget-config";

export async function loadBudgetConfig(): Promise<BudgetConfig> {
  try {
    return (await redis.get<BudgetConfig>(BUDGET_CONFIG_KEY)) ?? DEFAULT_BUDGET_CONFIG;
  } catch {
    return DEFAULT_BUDGET_CONFIG;
  }
}

export async function saveBudgetConfig(config: BudgetConfig): Promise<void> {
  try {
    await redis.set(BUDGET_CONFIG_KEY, config);
  } catch {
    // swallow — caller has no recovery path; config reverts to in-memory state on next load
  }
}

// The ONE month-scoped store in v2 — a factory (like v1's `monthlyKvStore`) would be
// premature for a single consumer; promote to one if a 2nd month-scoped store arrives.
// This is the ONLY place `finance-v2-transactions:{month}` keys are built.
export const transactionsKey = (month: string): string => `finance-v2-transactions:${month}`;

export async function loadTransactions(month: string): Promise<FinanceV2Transaction[]> {
  try {
    const stored = (await redis.get<FinanceV2Transaction[]>(transactionsKey(month))) ?? [];
    // Legacy backfill: a record saved before `month` existed is treated as belonging to
    // the key it was loaded from — no separate migration step (spec: Legacy Month Backfill
    // on Read). Idempotent: a record that already has `month` is left untouched.
    return stored.map((tx) => ({ ...tx, month: tx.month ?? month }));
  } catch {
    return [];
  }
}

export async function saveTransactions(
  month: string,
  transactions: FinanceV2Transaction[],
): Promise<void> {
  try {
    await redis.set(transactionsKey(month), transactions);
  } catch {
    // swallow — caller has no recovery path; list reverts to in-memory state on next load
  }
}

/** Read-append-write scoped to `month`'s key ONLY — composed of `loadTransactions`/
 *  `saveTransactions` (not a raw redis pair) so key construction stays in `transactionsKey`
 *  and this inherits the legacy backfill in `loadTransactions` for free. Used when a
 *  transaction's `month` differs from the currently viewed month (design decision #1). */
export async function appendTransactionToMonth(
  month: string,
  tx: FinanceV2Transaction,
): Promise<void> {
  const list = await loadTransactions(month);
  await saveTransactions(month, [...list, tx]);
}

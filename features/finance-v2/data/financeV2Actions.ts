"use server";

import { cookies } from "next/headers";
import type { FinanceV2Config, BudgetConfig, FinanceV2Transaction } from "@/features/finance-v2/domain";
import { isTransactionMonth } from "@/features/finance-v2/domain";
import {
  saveDashboardConfig,
  saveBudgetConfig,
  saveTransactions,
  appendTransactionToMonth,
  loadTransactions,
} from "./kvAdapter";

export async function handleSaveDashboardConfig(config: FinanceV2Config): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveDashboardConfig(config);
}

export async function handleSaveBudgetConfig(config: BudgetConfig): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveBudgetConfig(config);
}

// Whole-list-save action for the VIEWED month (deliberate deviation from granular add/
// delete actions): the hook computes the next list via the domain layer and sends the
// entire array, so there is no server-side read-modify-write — mirrors
// `handleSaveBudgetConfig` and v1's `saveTransactions` call site. Used when
// `tx.month === viewedMonth`; a transaction filed to a DIFFERENT month goes through
// `handleAppendTransactionToMonth` below instead.
export async function handleSaveTransactions(
  month: string,
  transactions: FinanceV2Transaction[],
): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveTransactions(month, transactions);
}

// Single-param — deliberately NOT `(month, tx)`. A two-param signature would let a caller
// pass `month !== tx.month`, silently writing a record whose own field lies about its
// key. Deriving the target month from `tx.month` makes that divergence unrepresentable.
// `isTransactionMonth` is the ONE validation gate before user input reaches a redis key.
export async function handleAppendTransactionToMonth(tx: FinanceV2Transaction): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  if (!isTransactionMonth(tx.month)) return;
  await appendTransactionToMonth(tx.month, tx);
}

// Unlike the RSC's direct `loadTransactions` call (already gated by the page-level
// redirect before it runs), this is invoked directly by the client hook on every month
// change and is therefore POST-reachable on its own — it must gate auth and validate
// `month` itself, making it the second `isTransactionMonth` call site (see
// `transactionDate.ts`).
export async function handleLoadTransactions(month: string): Promise<FinanceV2Transaction[]> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return [];
  if (!isTransactionMonth(month)) return [];
  return loadTransactions(month);
}

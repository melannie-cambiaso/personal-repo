"use server";

import { cookies } from "next/headers";
import type { FinanceV2Config, BudgetConfig, FinanceV2Transaction } from "@/features/finance-v2/domain";
import { saveDashboardConfig, saveBudgetConfig, saveTransactions } from "./kvAdapter";

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

// ONE whole-list-save action (deliberate deviation from granular add/delete actions):
// the hook computes the next list via the domain layer and sends the entire array, so
// there is no server-side read-modify-write — mirrors `handleSaveBudgetConfig` and v1's
// `saveTransactions` call site.
export async function handleSaveTransactions(
  month: string,
  transactions: FinanceV2Transaction[],
): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveTransactions(month, transactions);
}

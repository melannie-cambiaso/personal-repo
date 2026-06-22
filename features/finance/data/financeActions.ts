"use server";

import { cookies } from "next/headers";
import { saveEntries, saveBudget, loadBudget } from "./kvAdapter";
import type { FinanceEntry } from "../domain/FinanceEntry";

export async function handleSave(entries: FinanceEntry[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveEntries(entries);
}

export async function getBudgetForMonth(month: string): Promise<Record<string, number>> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return {};
  return loadBudget(month);
}

export async function handleSaveBudget(month: string, budget: Record<string, number>): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveBudget(month, budget);
}

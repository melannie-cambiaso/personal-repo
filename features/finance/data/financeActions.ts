"use server";

import { cookies } from "next/headers";
import { saveEntries, saveBudget } from "./kvAdapter";
import type { FinanceEntry } from "../domain/FinanceEntry";

export async function handleSave(entries: FinanceEntry[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveEntries(entries);
}

export async function handleSaveBudget(budget: Record<string, number>): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveBudget(budget);
}

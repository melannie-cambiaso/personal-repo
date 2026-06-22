"use server";

import { cookies } from "next/headers";
import { saveBudget, loadBudget, saveActual, loadActual } from "./kvAdapter";

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

export async function getActualForMonth(month: string): Promise<Record<string, number>> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return {};
  return loadActual(month);
}

export async function handleSaveActual(month: string, actual: Record<string, number>): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveActual(month, actual);
}

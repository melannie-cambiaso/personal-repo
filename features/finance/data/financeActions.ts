"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { FinanceTransaction } from "@/features/finance/domain";
import {
  saveBudget,
  loadBudget,
  saveActual,
  loadActual,
  loadCategories,
  saveCategories,
  loadTransactions,
  saveTransactions,
} from "./kvAdapter";

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

export async function addCategory(groupName: string, category: string): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;

  const trimmed = category.trim();
  if (!trimmed) throw new Error("Category name cannot be empty");

  const groups = await loadCategories();
  const group = groups.find((g) => g.name === groupName);
  if (!group) throw new Error(`Group "${groupName}" not found`);

  const duplicate = group.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) throw new Error(`Category "${trimmed}" already exists in group "${groupName}"`);

  group.categories.push(trimmed);
  await saveCategories(groups);
  revalidatePath("/finance");
}

export async function deleteCategory(groupName: string, category: string): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;

  const groups = await loadCategories();
  const group = groups.find((g) => g.name === groupName);
  if (!group) return;

  group.categories = group.categories.filter((c) => c !== category);
  await saveCategories(groups);
  revalidatePath("/finance");
}

export async function getTransactionsForMonth(month: string): Promise<FinanceTransaction[]> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return [];
  return loadTransactions(month);
}

export async function addTransaction(month: string, category: string, amount: number): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;

  const txs = await loadTransactions(month);
  txs.push({
    id: crypto.randomUUID(),
    category,
    amount,
    createdAt: new Date().toISOString(),
  });
  await saveTransactions(month, txs);
  revalidatePath("/finance");
}

export async function deleteTransaction(month: string, txId: string): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;

  const txs = await loadTransactions(month);
  await saveTransactions(
    month,
    txs.filter((tx) => tx.id !== txId)
  );
  revalidatePath("/finance");
}

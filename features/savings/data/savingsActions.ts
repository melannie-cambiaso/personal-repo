"use server";

import { cookies } from "next/headers";
import { saveEntries, saveGoals } from "./kvAdapter";
import type { SavingsEntry } from "../domain/SavingsEntry";
import type { SavingsGoal } from "../domain/SavingsGoal";

export async function handleSave(entries: SavingsEntry[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveEntries(entries);
}

export async function handleSaveGoals(goals: SavingsGoal[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveGoals(goals);
}

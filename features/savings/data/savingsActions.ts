"use server";

import { cookies } from "next/headers";
import { saveEntries, saveGoals, saveForecastConfig } from "./kvAdapter";
import type { SavingsEntry } from "../domain/SavingsEntry";
import type { SavingsGoal } from "../domain/SavingsGoal";
import type { ForecastConfig } from "../domain/ForecastConfig";

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

function pruneOverrides(config: ForecastConfig, months: number): ForecastConfig {
  const now = new Date();
  const validKeys = new Set<string>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    validKeys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const pruned: Record<string, number> = {};
  for (const [key, val] of Object.entries(config.incomeOverrides)) {
    if (validKeys.has(key)) pruned[key] = val;
  }
  return { ...config, incomeOverrides: pruned };
}

export async function handleSaveForecastConfig(
  config: ForecastConfig,
  months: number
): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveForecastConfig(pruneOverrides(config, months));
}

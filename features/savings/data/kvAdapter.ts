import "server-only";
import { redis } from "@/shared/kv";
import type { SavingsEntry } from "../domain/SavingsEntry";
import type { SavingsGoal } from "../domain/SavingsGoal";

const ENTRIES_KEY = "savings-entries";

export async function loadEntries(): Promise<SavingsEntry[]> {
  try {
    return (await redis.get<SavingsEntry[]>(ENTRIES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: SavingsEntry[]): Promise<void> {
  try {
    const sanitized = entries.map((e) =>
      e.type === "deposito" ? { ...e, toReplenish: false } : e
    );
    await redis.set(ENTRIES_KEY, sanitized);
  } catch (e) {
    console.error("savings.saveEntries failed", e);
  }
}

const GOALS_KEY = "savings-goals";

export async function loadGoals(): Promise<SavingsGoal[]> {
  try {
    const goals = (await redis.get<SavingsGoal[]>(GOALS_KEY)) ?? [];
    return goals.map((g) => ({ ...g, isDone: g.isDone ?? false }));
  } catch {
    return [];
  }
}

export async function saveGoals(goals: SavingsGoal[]): Promise<void> {
  try {
    await redis.set(GOALS_KEY, goals);
  } catch (e) {
    console.error("savings.saveGoals failed", e);
  }
}

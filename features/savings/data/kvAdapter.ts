import "server-only";
import { redis } from "@/shared/kv";
import type { SavingsEntry } from "../domain/SavingsEntry";
import type { SavingsGoal } from "../domain/SavingsGoal";
import type { SavingsPeriod } from "../domain/SavingsPeriod";

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
      e.type === "deposito" ? { ...e, toReplenish: false } : { ...e, goalId: undefined }
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

const PERIODS_KEY = "savings-periods";

export async function loadPeriods(): Promise<SavingsPeriod[]> {
  try {
    return (await redis.get<SavingsPeriod[]>(PERIODS_KEY)) ?? [];
  } catch {
    return [];
  }
}

/**
 * Merge-guard: no wire payload can express "mutate an existing period's
 * id/startedAt/initialAmount". For any period id that already exists in KV,
 * those three fields are forced back to the stored values before writing.
 */
export async function savePeriods(periods: SavingsPeriod[]): Promise<void> {
  try {
    const existingById = new Map((await loadPeriods()).map((p) => [p.id, p]));
    const guarded = periods.map((p) => {
      const stored = existingById.get(p.id);
      return stored
        ? { ...p, id: stored.id, startedAt: stored.startedAt, initialAmount: stored.initialAmount }
        : p;
    });
    await redis.set(PERIODS_KEY, guarded);
  } catch (e) {
    console.error("savings.savePeriods failed", e);
  }
}

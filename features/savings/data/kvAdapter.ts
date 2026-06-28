import "server-only";
import { redis } from "@/shared/kv";
import type { SavingsEntry } from "../domain/SavingsEntry";
import type { SavingsGoal } from "../domain/SavingsGoal";
import type { ForecastConfig } from "../domain/ForecastConfig";

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
      e.type === "deposito" ? { ...e, toReplenish: false } : e,
    );
    await redis.set(ENTRIES_KEY, sanitized);
  } catch (e) {
    console.error("savings.saveEntries failed", e);
  }
}

const GOALS_KEY = "savings-goals";

export async function loadGoals(): Promise<SavingsGoal[]> {
  try {
    return (await redis.get<SavingsGoal[]>(GOALS_KEY)) ?? [];
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

const FORECAST_CONFIG_KEY = "savings-forecast-config";

export async function loadForecastConfig(): Promise<ForecastConfig | null> {
  try {
    return (await redis.get<ForecastConfig>(FORECAST_CONFIG_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function saveForecastConfig(config: ForecastConfig): Promise<void> {
  try {
    await redis.set(FORECAST_CONFIG_KEY, config);
  } catch (e) {
    console.error("savings.saveForecastConfig failed", e);
  }
}

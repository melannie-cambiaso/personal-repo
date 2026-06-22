import "server-only";
import { redis } from "@/shared/kv";

const budgetKey = (month: string) => `finance-budget:${month}`;

export async function loadBudget(month: string): Promise<Record<string, number>> {
  try {
    return (await redis.get<Record<string, number>>(budgetKey(month))) ?? {};
  } catch {
    return {};
  }
}

export async function saveBudget(month: string, budget: Record<string, number>): Promise<void> {
  try {
    await redis.set(budgetKey(month), budget);
  } catch (e) {
    console.error("finance.saveBudget failed", e);
  }
}

const actualKey = (month: string) => `finance-actual:${month}`;

export async function loadActual(month: string): Promise<Record<string, number>> {
  try {
    return (await redis.get<Record<string, number>>(actualKey(month))) ?? {};
  } catch {
    return {};
  }
}

export async function saveActual(month: string, actual: Record<string, number>): Promise<void> {
  try {
    await redis.set(actualKey(month), actual);
  } catch (e) {
    console.error("finance.saveActual failed", e);
  }
}

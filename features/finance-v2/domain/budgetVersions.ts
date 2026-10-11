import type { BudgetCategory, BudgetConfig, BudgetSubcategory } from "./BudgetConfig";
import { DEFAULT_BUDGET_CONFIG } from "./BudgetConfig";

/** A budget snapshot that applies from `effectiveFrom` (`YYYY-MM`) until the next
 *  version's month. Editing a month never rewrites earlier months: it upserts the
 *  version for that month only. `"0000-00"` marks the legacy, pre-versioning config. */
export interface BudgetVersion {
  effectiveFrom: string;
  config: BudgetConfig;
  /** ISO timestamp of the last edit to this version. */
  updatedAt: string;
}

/** The config in force for `month`: the latest version with `effectiveFrom <= month`.
 *  `YYYY-MM` strings compare chronologically as plain strings. */
export function resolveBudgetForMonth(versions: BudgetVersion[], month: string): BudgetConfig {
  let match: BudgetVersion | null = null;
  for (const v of versions) {
    if (v.effectiveFrom <= month && (!match || v.effectiveFrom > match.effectiveFrom)) match = v;
  }
  return match?.config ?? DEFAULT_BUDGET_CONFIG;
}

/** Replaces (or inserts) the version effective in `month`; every other version is
 *  kept as-is. Returns a new list sorted by `effectiveFrom`. */
export function upsertBudgetVersion(
  versions: BudgetVersion[],
  month: string,
  config: BudgetConfig,
  now: string
): BudgetVersion[] {
  const next: BudgetVersion = { effectiveFrom: month, config, updatedAt: now };
  return [...versions.filter((v) => v.effectiveFrom !== month), next].sort((a, b) =>
    a.effectiveFrom.localeCompare(b.effectiveFrom)
  );
}

// Runtime shape checks for values read back from storage, where the TS type is only a
// promise. Every field the UI and the rollups read is checked, nested leaves included.

const BUCKETS: readonly unknown[] = ["fixed", "variable", "savings"];
const FREQUENCIES: readonly unknown[] = [undefined, "monthly", "weekly"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fields shared by a childless category and a subcategory (a budget leaf). */
function hasValidLeafFields(value: Record<string, unknown>): boolean {
  const { weekday } = value;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    BUCKETS.includes(value.bucket) &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    FREQUENCIES.includes(value.frequency) &&
    (weekday === undefined ||
      (typeof weekday === "number" && Number.isInteger(weekday) && weekday >= 0 && weekday <= 6))
  );
}

function isValidSubcategory(value: unknown): value is BudgetSubcategory {
  return isRecord(value) && hasValidLeafFields(value);
}

function isValidCategory(value: unknown): value is BudgetCategory {
  return (
    isRecord(value) &&
    hasValidLeafFields(value) &&
    Array.isArray(value.subcategories) &&
    value.subcategories.every(isValidSubcategory)
  );
}

export function isValidBudgetConfig(value: unknown): value is BudgetConfig {
  return (
    isRecord(value) && Array.isArray(value.categories) && value.categories.every(isValidCategory)
  );
}

export function isValidBudgetVersion(value: unknown): value is BudgetVersion {
  return (
    isRecord(value) &&
    typeof value.effectiveFrom === "string" &&
    /^\d{4}-\d{2}$/.test(value.effectiveFrom) &&
    typeof value.updatedAt === "string" &&
    isValidBudgetConfig(value.config)
  );
}

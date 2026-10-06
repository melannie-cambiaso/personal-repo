import type { BudgetConfig } from "./BudgetConfig";
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

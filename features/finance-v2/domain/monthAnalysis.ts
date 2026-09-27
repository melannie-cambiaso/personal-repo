import type { BucketKey } from "./BucketKey";
import type { BudgetConfig, BudgetFrequency } from "./BudgetConfig";
import type { FinanceV2Transaction } from "./FinanceV2Transaction";
import { resolveLeafMonthlyAmount, resolveLeafWeeks } from "./budgetAmount";
import { computeBudgetComparison } from "./budgetRollup";
import { computeSpendComparison, isOverrun } from "./spendRollup";
import { nextMonth, type Weekday } from "@/shared/utils/monthUtils";

/** Carries no month-wide week count: weekly leaves recurring on different
 *  weekdays can have different weeks in the same month, so weeks are reported
 *  per leaf (`LeafPerWeek.weeks`, `NextMonthOverrun.weeks`). */
export interface MonthAnalysisSummary {
  month: string;
  /** Week-adjusted budget for `month` (weekly leaves already scaled). */
  budgeted: number;
  spent: number;
  /** `budgeted - spent`: positive means the month came in under budget,
   *  negative means it overran. */
  difference: number;
  /** Spend with no resolvable budget leaf. ALREADY INCLUDED in `spent`, and
   *  deliberately absent from `deviations` — it is why the per-leaf rows can
   *  sum to less than `spent`. */
  unassigned: number;
}

export interface LeafPerWeek {
  budgeted: number;
  /** This month's actual spend divided by its weeks, rounded to whole money. */
  spentAvg: number;
  /** This leaf's weeks in the analyzed month: occurrences of its weekday. */
  weeks: number;
}

export interface LeafDeviation {
  id: string;
  name: string;
  /** Owning category's name when this leaf is a subcategory, else absent. */
  parentName?: string;
  bucket: BucketKey;
  /** Resolved, never absent: a legacy leaf reads as `"monthly"`. */
  frequency: BudgetFrequency;
  budgeted: number;
  spent: number;
  /** `spent - budgeted`: positive is an overrun, negative is a saving. Sign is
   *  the OPPOSITE of `MonthAnalysisSummary.difference`, because a deviation
   *  list is read worst-first. */
  deviation: number;
  /** Per-week view, for weekly leaves only — `null` for a monthly leaf, where
   *  a weekly figure would be a meaningless division of a monthly commitment. */
  perWeek: LeafPerWeek | null;
}

export interface NextMonthOverrun {
  id: string;
  name: string;
  parentName?: string;
  /** This leaf's weeks in NEXT month for a weekly leaf, `null` for a monthly
   *  one (mirrors `LeafDeviation.perWeek`). */
  weeks: number | null;
  /** This leaf's budget for NEXT month (weeks already applied). */
  budgeted: number;
  /** Spend if this month's pace holds: flat for a monthly leaf, re-scaled to
   *  next month's week count for a weekly one. */
  projectedSpend: number;
  /** `projectedSpend - budgeted` — how much to cut. Can come out negative for
   *  a weekly leaf whose overrun a shorter next month absorbs on its own. */
  projectedOverrun: number;
}

export interface NextMonthProjection {
  month: string;
  /** Same config, each weekly leaf scaled by its weeks in next month. */
  budgeted: number;
  /** Leaves that overran THIS month, biggest projected overrun first. */
  overruns: NextMonthOverrun[];
}

export interface MonthAnalysis {
  summary: MonthAnalysisSummary;
  /** Budget LEAVES (childless categories + subcategories), biggest overrun
   *  first down to biggest saving. A parent category never gets its own row:
   *  it holds no budget of its own (see `BudgetCategory.amount`). Leaves with
   *  neither budget nor spend are dropped as noise. */
  deviations: LeafDeviation[];
  nextMonth: NextMonthProjection;
}

interface LeafRef {
  id: string;
  name: string;
  parentName?: string;
  bucket: BucketKey;
  frequency: BudgetFrequency;
  /** Raw persisted weekday; `resolveLeafWeeks` applies the Monday default. */
  weekday?: Weekday;
  /** Raw persisted amount: per-week for a weekly leaf, monthly otherwise. */
  amount: number;
}

/** Read-only analysis of one month: how the week-adjusted budget compared to
 *  actual spend, which leaves deviated and by how much, and what next month
 *  looks like if nothing changes. Derives no budget arithmetic of its own — it
 *  composes `computeSpendComparison`/`computeBudgetComparison`, so these
 *  figures can never drift from the ones the Budget tab shows. */
export function computeMonthAnalysis(
  config: BudgetConfig,
  transactions: FinanceV2Transaction[],
  month: string,
): MonthAnalysis {
  const comparison = computeSpendComparison(config, transactions, month);
  const leaves = listBudgetLeaves(config);

  const deviations = leaves
    .map((leaf) => toLeafDeviation(leaf, comparison.leaves[leaf.id], month))
    .filter((row) => row.budgeted !== 0 || row.spent !== 0)
    .sort((a, b) => b.deviation - a.deviation);

  return {
    summary: {
      month,
      budgeted: comparison.total.budgeted,
      spent: comparison.total.spent,
      difference: comparison.total.budgeted - comparison.total.spent,
      unassigned: comparison.total.unassigned,
    },
    deviations,
    nextMonth: projectNextMonth(config, leaves, deviations, month),
  };
}

function toLeafDeviation(
  leaf: LeafRef,
  row: { budgeted: number; spent: number } | undefined,
  month: string,
): LeafDeviation {
  // `computeSpendComparison` walks this same leaf set, so the fallback is
  // unreachable by construction; it stays as a fail-soft guard.
  const budgeted = row?.budgeted ?? 0;
  const spent = row?.spent ?? 0;

  return {
    id: leaf.id,
    name: leaf.name,
    parentName: leaf.parentName,
    bucket: leaf.bucket,
    frequency: leaf.frequency,
    budgeted,
    spent,
    deviation: spent - budgeted,
    perWeek: leaf.frequency === "weekly" ? toLeafPerWeek(leaf, spent, month) : null,
  };
}

function toLeafPerWeek(leaf: LeafRef, spent: number, month: string): LeafPerWeek {
  const weeks = resolveLeafWeeks(leaf, month);
  return { budgeted: leaf.amount, spentAvg: perWeek(spent, weeks), weeks };
}

function projectNextMonth(
  config: BudgetConfig,
  leaves: LeafRef[],
  deviations: LeafDeviation[],
  month: string,
): NextMonthProjection {
  const target = nextMonth(month);
  const byId = new Map(leaves.map((leaf) => [leaf.id, leaf]));

  const overruns = deviations
    .filter((row) => isOverrun(row))
    .map((row) => {
      const leaf = byId.get(row.id);
      const budgeted = leaf ? resolveLeafMonthlyAmount(leaf, target) : 0;
      // A monthly commitment repeats at the same amount; a weekly habit repeats
      // at the same PER-WEEK pace, which a longer or shorter month re-scales.
      // Both week counts are the leaf's own weekday occurrences.
      const isWeekly = leaf?.frequency === "weekly";
      const targetWeeks = isWeekly ? resolveLeafWeeks(leaf, target) : null;
      const projectedSpend =
        isWeekly && targetWeeks !== null
          ? perWeek(row.spent, resolveLeafWeeks(leaf, month)) * targetWeeks
          : row.spent;

      return {
        id: row.id,
        name: row.name,
        parentName: row.parentName,
        weeks: targetWeeks,
        budgeted,
        projectedSpend,
        projectedOverrun: projectedSpend - budgeted,
      };
    })
    .sort((a, b) => b.projectedOverrun - a.projectedOverrun);

  return {
    month: target,
    budgeted: computeBudgetComparison(config, target).total.budgeted,
    overruns,
  };
}

/** Rounded to whole money: these figures are displayed, and a raw division
 *  would surface floating-point tails in the UI. `resolveLeafWeeks` never
 *  returns 0, so this cannot divide by zero. */
function perWeek(spent: number, weeks: number): number {
  return Math.round(spent / weeks);
}

/** Flattens the config into the same leaf set `computeBucketTotals` sums:
 *  childless categories plus every subcategory, in config order. */
function listBudgetLeaves(config: BudgetConfig): LeafRef[] {
  const leaves: LeafRef[] = [];

  for (const category of config.categories) {
    if (category.subcategories.length === 0) {
      leaves.push({
        id: category.id,
        name: category.name,
        bucket: category.bucket,
        frequency: category.frequency ?? "monthly",
        weekday: category.weekday,
        amount: category.amount,
      });
      continue;
    }
    for (const sub of category.subcategories) {
      leaves.push({
        id: sub.id,
        name: sub.name,
        parentName: category.name,
        bucket: sub.bucket,
        frequency: sub.frequency ?? "monthly",
        weekday: sub.weekday,
        amount: sub.amount,
      });
    }
  }

  return leaves;
}

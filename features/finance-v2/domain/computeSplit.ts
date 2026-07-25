import type { FinanceV2Config } from "./FinanceV2Config";

export type BucketKey = "fixed" | "variable" | "savings";

export interface SplitBucket {
  key: BucketKey;
  percentage: number;
  amount: number;
}

/** Amounts are unrepresentable on the invalid branch: when the three percentages
 *  don't sum to exactly 100, there is no valid target to show, so the type gives
 *  the UI nothing to leak. */
export type SplitResult =
  | { status: "valid"; buckets: SplitBucket[] } // ordered: fixed, variable, savings
  | { status: "invalid"; reason: "percentages-must-sum-to-100"; totalPercentage: number };

/** Exact `income * pct / 100`, no rounding here — `formatCLP` rounds at render
 *  time (shared/utils/formatCurrency.ts), so rounding twice would drift. */
export function computeSplit(config: FinanceV2Config): SplitResult {
  const { income, fixedPct, variablePct, savingsPct } = config;
  const totalPercentage = fixedPct + variablePct + savingsPct;

  if (totalPercentage !== 100) {
    return { status: "invalid", reason: "percentages-must-sum-to-100", totalPercentage };
  }

  const buckets: SplitBucket[] = [
    { key: "fixed", percentage: fixedPct, amount: (income * fixedPct) / 100 },
    { key: "variable", percentage: variablePct, amount: (income * variablePct) / 100 },
    { key: "savings", percentage: savingsPct, amount: (income * savingsPct) / 100 },
  ];

  return { status: "valid", buckets };
}

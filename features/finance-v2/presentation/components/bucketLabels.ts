import type { BucketKey } from "@/features/finance-v2/domain";

// Single source of truth for bucket copy/order, shared by SplitSummary,
// IncomeSplitTab, and BucketComparison (design decision #6).
export const BUCKET_LABELS: Record<BucketKey, string> = {
  fixed: "Fijos",
  variable: "Variables",
  savings: "Ahorro",
};

export const BUCKET_ORDER: BucketKey[] = ["fixed", "variable", "savings"];

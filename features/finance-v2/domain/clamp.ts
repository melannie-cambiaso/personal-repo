/** Shared floor: parses `raw`, treats NaN/invalid as 0, and rejects negatives.
 *  Mirrors v1's `Math.max(0, Number(raw) || 0)` (see `BudgetTab.handleBlur`). */
function nonNegativeNumber(raw: string | number): number {
  return Math.max(0, Number(raw) || 0);
}

/** `nonNegativeNumber` plus integer rounding since CLP has no cents. */
export function clampIncome(raw: string | number): number {
  return Math.round(nonNegativeNumber(raw));
}

/** Same floor as `clampIncome`, plus a ceiling of 100 and integer rounding so
 *  whole percentages sum to exactly 100 without float drift. */
export function clampPercentage(raw: string | number): number {
  return Math.round(Math.min(100, nonNegativeNumber(raw)));
}

/** Same floor as `clampIncome`, integer rounding since CLP has no cents. */
export function clampAmount(raw: string | number): number {
  return Math.round(nonNegativeNumber(raw));
}

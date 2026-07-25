/** Mirrors v1's `Math.max(0, Number(raw) || 0)` (see `BudgetTab.handleBlur`),
 *  plus integer rounding since CLP has no cents. */
export function clampIncome(raw: string | number): number {
  return Math.round(Math.max(0, Number(raw) || 0));
}

/** Same floor as `clampIncome`, plus a ceiling of 100 and integer rounding so
 *  whole percentages sum to exactly 100 without float drift. */
export function clampPercentage(raw: string | number): number {
  return Math.round(Math.min(100, Math.max(0, Number(raw) || 0)));
}

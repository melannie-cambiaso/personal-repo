/** Shared floor: parses `raw`, treats NaN/invalid as 0, and rejects negatives.
 *  Mirrors v1's `Math.max(0, Number(raw) || 0)` (see `BudgetTab.handleBlur`). */
function nonNegativeNumber(raw: string | number): number {
  return Math.max(0, Number(raw) || 0);
}

/** `nonNegativeNumber` plus integer rounding since CLP has no cents. */
export function clampAmount(raw: string | number): number {
  return Math.round(nonNegativeNumber(raw));
}

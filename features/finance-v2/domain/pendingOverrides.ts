/** Month-scoped map of leaf id -> user-corrected pendiente. Pure, no I/O. */
export type PendingOverrides = Record<string, number>;

/** Sets (creates or overwrites) a leaf's override. `amount` is assumed
 *  already clamped by the caller (mirrors `setLeafAmount`'s contract) -
 *  this function does not re-clamp. Returns a new object; input untouched. */
export function setPendingOverride(
  overrides: PendingOverrides,
  input: { leafId: string; amount: number },
): PendingOverrides {
  return { ...overrides, [input.leafId]: input.amount };
}

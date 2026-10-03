export type WishlistPriority = "high" | "medium" | "low";

export const PRIORITY_LABELS: Record<WishlistPriority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

/** Items stored before priorities existed carry none; reading them as "medium"
 *  keeps them in the middle of the list instead of burying or promoting them,
 *  without having to migrate persisted data. */
export function resolvePriority(item: { priority?: WishlistPriority }): WishlistPriority {
  return item.priority ?? "medium";
}

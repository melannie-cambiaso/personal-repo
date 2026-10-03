import { orderWishlist } from "./orderWishlist";
import type { WishlistItem } from "./WishlistItem";

export interface WishlistSummary {
  /** Items not yet owned. */
  pendingCount: number;
  /** Sum of pending prices; legacy items with no price are left out. */
  total: number;
  /** Pending "high" items in the user's manual (array) order, capped at `topLimit`. */
  topHigh: WishlistItem[];
}

/** One rule for the `/wishlist` header (via `useWishlist`) and the home summary, so
 *  both pages never disagree on what is pending or how much it adds up to. */
export function summarizeWishlist(
  items: WishlistItem[],
  ownedIds: ReadonlySet<string>,
  topLimit = 3
): WishlistSummary {
  const pending = items.filter((i) => !ownedIds.has(i.id));
  const total = pending.reduce((sum, i) => (i.price === null ? sum : sum + i.price), 0);
  const topHigh = orderWishlist(items, ownedIds).high.slice(0, topLimit);

  return { pendingCount: pending.length, total, topHigh };
}

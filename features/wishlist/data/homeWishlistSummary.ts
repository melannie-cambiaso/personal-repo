import "server-only";
import { summarizeWishlist, type WishlistSummary } from "../domain/summarizeWishlist";
import { loadItems, loadOwnedIds } from "./kvAdapter";

/** The wishlist summary shown on the home page, computed with the same domain function
 *  as the `/wishlist` header so both pages never disagree.
 *
 *  Not a Server Action: consumed by the RSC page after its own cookie gate, same as
 *  `loadHomeFinanceSummary`. Kept out of the `data` barrel because client components
 *  import `CATEGORIES` from it. */
export async function loadHomeWishlistSummary(): Promise<WishlistSummary> {
  const [items, ownedIds] = await Promise.all([loadItems(), loadOwnedIds()]);
  return summarizeWishlist(items, ownedIds);
}

import "server-only";
import { summarizeWishlist, type WishlistSummary } from "../domain/summarizeWishlist";
import { loadItems, loadOwnedIds } from "./kvAdapter";

/** The wishlist summary shown on the home page, computed with the same domain function
 *  as the `/wishlist` header so both pages never disagree.
 *
 *  Not a Server Action: consumed by the RSC page after its own cookie gate, same as
 *  `loadHomeFinanceSummary`. Imported by its own module path (the `data` folder has no
 *  barrel), so this `server-only` loader never reaches a client bundle. */
export async function loadHomeWishlistSummary(): Promise<WishlistSummary> {
  const [items, ownedIds] = await Promise.all([loadItems(), loadOwnedIds()]);
  return summarizeWishlist(items, ownedIds);
}

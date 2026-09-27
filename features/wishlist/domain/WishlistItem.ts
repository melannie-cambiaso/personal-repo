import type { Category } from "./Category";

/** A wishlist item is, at minimum, something wanted: `title` is the only field
 *  that has to exist for the entry to mean anything. `emoji`, `brand` and
 *  `description` used to be required, which forced anyone jotting down a passing
 *  idea to also compose a product listing for it — so they stopped jotting things
 *  down. Everything past `title` is enrichment, addable later by editing.
 *
 *  Widening these to optional is backward compatible: items already persisted with
 *  all three still satisfy this shape, so no stored data needs migrating. */
export interface WishlistItem {
  id: string;
  category: Category;
  emoji?: string;
  image?: string;
  brand?: string;
  title: string;
  description?: string;
  tag?: string;
  price: number | null;
  url?: string;
}

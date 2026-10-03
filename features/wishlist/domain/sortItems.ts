import { resolvePriority, type WishlistPriority } from "./Priority";
import type { WishlistItem } from "./WishlistItem";

export type SortKey =
  | "default"
  | "priority"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc";

const PRIORITY_RANK: Record<WishlistPriority, number> = { high: 0, medium: 1, low: 2 };

const priceAsc = (i: WishlistItem) => (i.price === null ? Infinity : i.price);
// ponytail: -Infinity keeps null prices last in descending order
const priceDesc = (i: WishlistItem) => (i.price === null ? -Infinity : i.price);

const compare: Record<Exclude<SortKey, "default">, (a: WishlistItem, b: WishlistItem) => number> = {
  priority: (a, b) =>
    PRIORITY_RANK[resolvePriority(a)] - PRIORITY_RANK[resolvePriority(b)] ||
    priceAsc(a) - priceAsc(b) ||
    a.title.localeCompare(b.title),
  "name-asc": (a, b) => a.title.localeCompare(b.title),
  "name-desc": (a, b) => b.title.localeCompare(a.title),
  "price-asc": (a, b) => priceAsc(a) - priceAsc(b),
  "price-desc": (a, b) => priceDesc(b) - priceDesc(a),
};

/** "default" keeps insertion order. Items in `ownedIds` always go last, keeping
 *  the chosen order within each group — already-owned things aren't wishes anymore. */
export function sortItems(
  items: WishlistItem[],
  key: SortKey,
  ownedIds?: ReadonlySet<string>
): WishlistItem[] {
  const sorted = key === "default" ? [...items] : [...items].sort(compare[key]);
  if (!ownedIds?.size) return sorted;
  return [
    ...sorted.filter((i) => !ownedIds.has(i.id)),
    ...sorted.filter((i) => ownedIds.has(i.id)),
  ];
}

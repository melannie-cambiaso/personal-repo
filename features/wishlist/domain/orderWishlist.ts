import { resolvePriority, type WishlistPriority } from "./Priority";
import type { WishlistItem } from "./WishlistItem";

export interface WishlistGroups {
  high: WishlistItem[];
  medium: WishlistItem[];
  low: WishlistItem[];
  owned: WishlistItem[];
}

/** The stored array order IS the user's manual order: there is no rank field.
 *  Pending items are split by priority and owned items set apart, each group
 *  keeping the relative order it has in `items` — nothing else is sorted. */
export function orderWishlist(
  items: WishlistItem[],
  ownedIds: ReadonlySet<string>
): WishlistGroups {
  const groups: WishlistGroups = { high: [], medium: [], low: [], owned: [] };
  for (const item of items) {
    groups[ownedIds.has(item.id) ? "owned" : resolvePriority(item)].push(item);
  }
  return groups;
}

/** Display order: high, medium, low, then owned. */
export function flattenWishlistGroups(groups: WishlistGroups): WishlistItem[] {
  return [...groups.high, ...groups.medium, ...groups.low, ...groups.owned];
}

/** Moves are confined to the item's group: it swaps places in the full array with
 *  the nearest pending item of the same priority in `direction`, so items of other
 *  groups sitting between them keep their positions. Owned items are not movable.
 *  When the move is impossible (edge of the group, owned item, unknown id) the
 *  input array itself is returned, so callers can skip saving by reference check.
 *  Never mutates `items`. */
export function moveItem(
  items: WishlistItem[],
  ownedIds: ReadonlySet<string>,
  id: string,
  direction: "up" | "down"
): WishlistItem[] {
  const from = items.findIndex((i) => i.id === id);
  if (from === -1 || ownedIds.has(id)) return items;

  const priority: WishlistPriority = resolvePriority(items[from]);
  const step = direction === "up" ? -1 : 1;
  let to = from + step;
  while (
    to >= 0 &&
    to < items.length &&
    (ownedIds.has(items[to].id) || resolvePriority(items[to]) !== priority)
  ) {
    to += step;
  }
  if (to < 0 || to >= items.length) return items;

  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

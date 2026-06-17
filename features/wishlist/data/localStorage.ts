import type { WishlistItem } from "../domain/WishlistItem";
import { WISHLIST_ITEMS } from "./items";

const ITEMS_KEY = "wishlist-items";
const OWNED_KEY = "wishlist-owned";

export function loadItems(): WishlistItem[] {
  const raw = localStorage.getItem(ITEMS_KEY);
  if (!raw) {
    saveItems(WISHLIST_ITEMS);
    return WISHLIST_ITEMS;
  }
  try {
    return JSON.parse(raw) as WishlistItem[];
  } catch {
    return WISHLIST_ITEMS;
  }
}

export function saveItems(items: WishlistItem[]): void {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function loadOwnedIds(): Set<string> {
  const raw = localStorage.getItem(OWNED_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveOwnedIds(ids: Set<string>): void {
  localStorage.setItem(OWNED_KEY, JSON.stringify([...ids]));
}

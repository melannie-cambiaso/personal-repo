import "server-only";
import type { WishlistItem } from "../domain/WishlistItem";
import { WISHLIST_ITEMS } from "./items";
import { redis } from "@/shared/kv";

const ITEMS_KEY = "wishlist-items";
const OWNED_KEY = "wishlist-owned";

export async function loadItems(): Promise<WishlistItem[]> {
  try {
    const data = await redis.get<WishlistItem[]>(ITEMS_KEY);
    if (!data) {
      await redis.set(ITEMS_KEY, WISHLIST_ITEMS);
      return WISHLIST_ITEMS;
    }
    return data;
  } catch {
    return WISHLIST_ITEMS;
  }
}

export async function saveItems(items: WishlistItem[]): Promise<void> {
  try {
    await redis.set(ITEMS_KEY, items);
  } catch (e) {
    console.error("kvAdapter.saveItems failed", e);
  }
}

export async function loadOwnedIds(): Promise<Set<string>> {
  try {
    const data = await redis.get<string[]>(OWNED_KEY);
    return new Set(data ?? []);
  } catch {
    return new Set();
  }
}

export async function saveOwnedIds(ids: Set<string>): Promise<void> {
  try {
    await redis.set(OWNED_KEY, [...ids]);
  } catch (e) {
    console.error("kvAdapter.saveOwnedIds failed", e);
  }
}

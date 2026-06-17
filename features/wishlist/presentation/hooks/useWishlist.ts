"use client";

import { useEffect, useRef, useState } from "react";
import { WISHLIST_ITEMS } from "@/features/wishlist/data";
import { loadItems, loadOwnedIds, saveItems, saveOwnedIds } from "@/features/wishlist/data/localStorage";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>(WISHLIST_ITEMS);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const hydrated = useRef(false);

  useEffect(() => {
    setItems(loadItems());
    setOwnedIds(loadOwnedIds());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveItems(items);
  }, [items]);

  useEffect(() => {
    if (!hydrated.current) return;
    saveOwnedIds(ownedIds);
  }, [ownedIds]);

  const addItem = (item: WishlistItem) => setItems((prev) => [item, ...prev]);

  const toggle = (id: string) =>
    setOwnedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const pending = items.filter((i) => !ownedIds.has(i.id)).length;
  const totalPrice = items
    .filter((i) => !ownedIds.has(i.id) && i.price !== null)
    .reduce((sum, i) => sum + (i.price as number), 0);

  return { items, ownedIds, addItem, toggle, pending, totalPrice };
}

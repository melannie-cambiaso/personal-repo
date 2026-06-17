"use client";

import { useEffect, useRef, useState } from "react";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";

interface Params {
  initialItems: WishlistItem[];
  onAdd: (items: WishlistItem[]) => Promise<void> | void;
}

export function useWishlist({ initialItems, onAdd }: Params) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [isHydrated] = useState(false);
  const itemsRef = useRef(initialItems);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addItem = (item: WishlistItem) => {
    const nextItems = [item, ...itemsRef.current];
    itemsRef.current = nextItems;
    setItems(nextItems);
    void onAdd(nextItems);
  };

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

  return { items, ownedIds, addItem, toggle, pending, totalPrice, isHydrated };
}

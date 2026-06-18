"use client";

import { useEffect, useRef, useState } from "react";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";

interface Params {
  initialItems: WishlistItem[];
  initialOwnedIds: string[];
  onAdd: (items: WishlistItem[]) => Promise<void> | void;
  onToggle: (ids: string[]) => Promise<void> | void;
}

export function useWishlist({ initialItems, initialOwnedIds, onAdd, onToggle }: Params) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set(initialOwnedIds));
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

  const editItem = (item: WishlistItem) => {
    const next = itemsRef.current.map((i) => (i.id === item.id ? item : i));
    itemsRef.current = next;
    setItems(next);
    void onAdd(next);
  };

  const toggle = (id: string) => {
    const next = new Set(ownedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOwnedIds(next);
    void onToggle([...next]);
  };

  const pending = items.filter((i) => !ownedIds.has(i.id)).length;
  const totalPrice = items
    .filter((i) => !ownedIds.has(i.id) && i.price !== null)
    .reduce((sum, i) => sum + (i.price as number), 0);

  return { items, ownedIds, addItem, editItem, toggle, pending, totalPrice };
}

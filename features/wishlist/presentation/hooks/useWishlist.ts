"use client";

import { useEffect, useRef, useState } from "react";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";
import { summarizeWishlist } from "@/features/wishlist/domain/summarizeWishlist";
import { moveItem } from "@/features/wishlist/domain/orderWishlist";

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

  const move = (id: string, direction: "up" | "down") => {
    const next = moveItem(itemsRef.current, ownedIds, id, direction);
    // Same reference: the move was impossible, so there is nothing to save.
    if (next === itemsRef.current) return;
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

  const deleteItem = (id: string) => {
    const nextItems = itemsRef.current.filter((i) => i.id !== id);
    if (nextItems.length === itemsRef.current.length) return;
    itemsRef.current = nextItems;
    setItems(nextItems);
    const nextOwned = new Set(ownedIds);
    nextOwned.delete(id);
    setOwnedIds(nextOwned);
    void onAdd(nextItems);
    void onToggle([...nextOwned]);
  };

  const { pendingCount: pending, total: totalPrice } = summarizeWishlist(items, ownedIds);

  return { items, ownedIds, addItem, editItem, deleteItem, move, toggle, pending, totalPrice };
}

"use client";

import { useState } from "react";
import {
  WishListAddButton,
  WishlistAddItemModal,
  WishlistHeader,
  WishlistItemCard,
} from "../../components";
import { useWishlist } from "../../hooks/useWishlist";
import { WishlistItem } from "@/features/wishlist/domain";

interface Props {
  initialItems: WishlistItem[];
  initialOwnedIds: string[];
  isOwner: boolean;
  onAdd: (items: WishlistItem[]) => Promise<void> | void;
  onToggle: (ids: string[]) => Promise<void> | void;
}

export function DashboardScreen({ initialItems, initialOwnedIds, isOwner, onAdd, onToggle }: Props) {
  const { items, ownedIds, addItem, toggle, pending, totalPrice } = useWishlist({
    initialItems,
    initialOwnedIds,
    onAdd,
    onToggle,
  });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="flex flex-1 flex-col">
      <WishlistHeader total={items.length} pending={pending} totalPrice={totalPrice} />

      <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
        {isOwner && (
          <div className="mb-6 flex justify-end">
            <WishListAddButton onClick={() => setIsOpen(true)} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <WishlistItemCard
              key={item.id}
              {...item}
              owned={ownedIds.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      </div>

      {isOwner && (
        <WishlistAddItemModal isOpen={isOpen} onClose={() => setIsOpen(false)} onAdd={addItem} />
      )}
    </main>
  );
}

export default DashboardScreen;

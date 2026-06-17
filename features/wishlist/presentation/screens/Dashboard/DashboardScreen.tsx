"use client";

import { useState } from "react";
import {
  WishListAddButton,
  WishlistAddItemModal,
  WishlistHeader,
  WishlistItemCard,
  WishlistItemSkeleton,
} from "../../components";
import { useWishlist } from "../../hooks/useWishlist";
import { WishlistItem } from "@/features/wishlist/domain";

const SKELETON_COUNT = 10;

interface Props {
  initialItems: WishlistItem[];
  onAdd: (items: WishlistItem[]) => void;
}

export function DashboardScreen({ initialItems, onAdd }: Props) {
  const { items, ownedIds, addItem, toggle, pending, totalPrice } = useWishlist({
    initialItems,
    onAdd,
  });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="flex flex-1 flex-col">
      <WishlistHeader total={items.length} pending={pending} totalPrice={totalPrice} />

      <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
        <div className="mb-6 flex justify-end">
          <WishListAddButton onClick={() => setIsOpen(true)} />
        </div>
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

      <WishlistAddItemModal isOpen={isOpen} onClose={() => setIsOpen(false)} onAdd={addItem} />
    </main>
  );
}

export default DashboardScreen;

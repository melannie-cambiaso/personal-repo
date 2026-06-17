"use client";

import { useState } from "react";
import { useWishlist } from "../../hooks/useWishlist";
import { WishlistHeader } from "../../components/Header/WishlistHeader";
import { WishlistItemCard } from "../../components/Card/WishlistItemCard";
import { WishListAddButton } from "../../components/AddButton/WishListAddButton";
import { WishlistAddItemModal } from "../../components/Modal/WishlistAddItemModal";

export function DashboardScreen() {
  const { items, ownedIds, addItem, toggle, pending, totalPrice } = useWishlist();
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

      <WishlistAddItemModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAdd={addItem}
      />
    </main>
  );
}

export default DashboardScreen;

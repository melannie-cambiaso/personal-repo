"use client";

import { useState } from "react";
import { WISHLIST_ITEMS } from "@/features/wishlist/data";
import { WishlistHeader } from "../../components/Header/WishlistHeader";
import { WishlistItemCard } from "../../components/Card/WishlistItemCard";
import { WishListAddButton } from "../../components";

export function DashboardScreen() {
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (id: string) =>
    setOwnedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const pending = WISHLIST_ITEMS.filter((i) => !ownedIds.has(i.id)).length;
  const totalPrice = WISHLIST_ITEMS.filter((i) => !ownedIds.has(i.id) && i.price !== null).reduce(
    (sum, i) => sum + (i.price as number),
    0
  );

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <main className="flex flex-1 flex-col">
      <WishlistHeader total={WISHLIST_ITEMS.length} pending={pending} totalPrice={totalPrice} />
      <WishListAddButton onClick={handleClick} />
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WISHLIST_ITEMS.map((item) => (
            <WishlistItemCard
              key={item.id}
              {...item}
              owned={ownedIds.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default DashboardScreen;

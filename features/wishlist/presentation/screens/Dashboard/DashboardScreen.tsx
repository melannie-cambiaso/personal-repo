"use client";

import { useState } from "react";
import {
  WishListAddButton,
  WishlistAddItemModal,
  WishlistDeleteConfirmModal,
  WishlistHeader,
  WishlistItemCard,
} from "../../components";
import { useWishlist } from "../../hooks/useWishlist";
import { WishlistItem } from "@/features/wishlist/domain";
import { sortItems, type SortKey } from "@/features/wishlist/domain/sortItems";

interface Props {
  initialItems: WishlistItem[];
  initialOwnedIds: string[];
  isOwner: boolean;
  onAdd: (items: WishlistItem[]) => Promise<void> | void;
  onToggle: (ids: string[]) => Promise<void> | void;
}

export function DashboardScreen({ initialItems, initialOwnedIds, isOwner, onAdd, onToggle }: Props) {
  const { items, ownedIds, addItem, editItem, deleteItem, toggle, pending, totalPrice } = useWishlist({
    initialItems,
    initialOwnedIds,
    onAdd,
    onToggle,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<WishlistItem | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("price-asc");

  const handleClose = () => {
    setIsOpen(false);
    setEditingItem(null);
  };

  return (
    <main className="flex flex-1 flex-col">
      <WishlistHeader total={items.length} pending={pending} totalPrice={totalPrice} />

      <div className="mx-auto w-full max-w-350 px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600 cursor-pointer"
          >
            <option value="default">Ordenar</option>
            <option value="name-asc">Nombre A→Z</option>
            <option value="name-desc">Nombre Z→A</option>
            <option value="price-asc">Precio ↑</option>
            <option value="price-desc">Precio ↓</option>
          </select>

          {isOwner && <WishListAddButton onClick={() => setIsOpen(true)} />}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sortItems(items, sortBy).map((item) => (
            <WishlistItemCard
              key={item.id}
              {...item}
              owned={ownedIds.has(item.id)}
              onToggle={() => toggle(item.id)}
              onEdit={isOwner ? () => setEditingItem(item) : undefined}
              onDelete={isOwner ? () => setDeletingItem(item) : undefined}
            />
          ))}
        </div>
      </div>

      {isOwner && (
        <>
          <WishlistAddItemModal
            isOpen={isOpen || editingItem !== null}
            onClose={handleClose}
            onAdd={(item) => {
              if (editingItem) editItem(item);
              else addItem(item);
            }}
            editItem={editingItem ?? undefined}
          />
          <WishlistDeleteConfirmModal
            item={deletingItem}
            onConfirm={() => { if (deletingItem) deleteItem(deletingItem.id); setDeletingItem(null); }}
            onCancel={() => setDeletingItem(null)}
          />
        </>
      )}
    </main>
  );
}

export default DashboardScreen;

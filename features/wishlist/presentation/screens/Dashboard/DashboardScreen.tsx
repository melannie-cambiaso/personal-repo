"use client";

import { useState } from "react";
import {
  WishlistAddItemModal,
  WishlistDeleteConfirmModal,
  WishlistHeader,
  WishlistItemRow,
} from "../../components";
import { AddButton, Select } from "@/shared/components";
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

export function DashboardScreen({
  initialItems,
  initialOwnedIds,
  isOwner,
  onAdd,
  onToggle,
}: Props) {
  const { items, ownedIds, addItem, editItem, deleteItem, toggle, pending, totalPrice } =
    useWishlist({
      initialItems,
      initialOwnedIds,
      onAdd,
      onToggle,
    });
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<WishlistItem | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("priority");

  const handleClose = () => {
    setIsOpen(false);
    setEditingItem(null);
  };

  return (
    <main className="flex flex-1 flex-col">
      <WishlistHeader total={items.length} pending={pending} totalPrice={totalPrice} />

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="cursor-pointer"
            options={[
              { value: "priority", label: "Prioridad" },
              { value: "default", label: "Ordenar" },
              { value: "name-asc", label: "Nombre A→Z" },
              { value: "name-desc", label: "Nombre Z→A" },
              { value: "price-asc", label: "Precio ↑" },
              { value: "price-desc", label: "Precio ↓" },
            ]}
          />

          {isOwner && <AddButton onClick={() => setIsOpen(true)} />}
        </div>

        <ul className="border-cream-300 divide-cream-300 divide-y overflow-hidden rounded-xl border bg-white">
          {sortItems(items, sortBy, ownedIds).map((item) => (
            <WishlistItemRow
              key={item.id}
              item={item}
              owned={ownedIds.has(item.id)}
              onToggle={toggle}
              onEdit={isOwner ? setEditingItem : undefined}
              onDelete={isOwner ? setDeletingItem : undefined}
            />
          ))}
        </ul>
      </div>

      {isOwner && (
        <>
          <WishlistAddItemModal
            key={editingItem?.id ?? (isOpen ? "add-open" : "closed")}
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
            onConfirm={() => {
              if (deletingItem) deleteItem(deletingItem.id);
              setDeletingItem(null);
            }}
            onCancel={() => setDeletingItem(null)}
          />
        </>
      )}
    </main>
  );
}

export default DashboardScreen;

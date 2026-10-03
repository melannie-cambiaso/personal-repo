"use client";

import { useState } from "react";
import {
  WishlistAddItemModal,
  WishlistDeleteConfirmModal,
  WishlistHeader,
  WishlistItemRow,
} from "../../components";
import { AddButton } from "@/shared/components";
import { useWishlist } from "../../hooks/useWishlist";
import {
  orderWishlist,
  PRIORITY_LABELS,
  type WishlistGroups,
  type WishlistItem,
} from "@/features/wishlist/domain";

const GROUPS: { key: keyof WishlistGroups; label: string }[] = [
  { key: "high", label: PRIORITY_LABELS.high },
  { key: "medium", label: PRIORITY_LABELS.medium },
  { key: "low", label: PRIORITY_LABELS.low },
  { key: "owned", label: "Comprados" },
];

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
  const { items, ownedIds, addItem, editItem, deleteItem, move, toggle, pending, totalPrice } =
    useWishlist({
      initialItems,
      initialOwnedIds,
      onAdd,
      onToggle,
    });
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<WishlistItem | null>(null);
  const groups = orderWishlist(items, ownedIds);

  const handleClose = () => {
    setIsOpen(false);
    setEditingItem(null);
  };

  return (
    <main className="flex flex-1 flex-col">
      <WishlistHeader total={items.length} pending={pending} totalPrice={totalPrice} />

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        {isOwner && (
          <div className="mb-6 flex items-center justify-end">
            <AddButton onClick={() => setIsOpen(true)} />
          </div>
        )}

        <div className="flex flex-col gap-6">
          {GROUPS.filter(({ key }) => groups[key].length > 0).map(({ key, label }) => {
            const group = groups[key];
            // Only pending items have a manual order to change; owned ones never move.
            const movable = isOwner && key !== "owned";
            return (
              <section key={key} className="flex flex-col gap-2">
                <h2 className="text-2xs tracking-badge text-brown-500 font-bold uppercase">
                  {label}
                </h2>
                <ul className="border-cream-300 divide-cream-300 divide-y overflow-hidden rounded-xl border bg-white">
                  {group.map((item, index) => (
                    <WishlistItemRow
                      key={item.id}
                      item={item}
                      owned={ownedIds.has(item.id)}
                      onToggle={toggle}
                      onEdit={isOwner ? setEditingItem : undefined}
                      onDelete={isOwner ? setDeletingItem : undefined}
                      onMoveUp={movable ? (id) => move(id, "up") : undefined}
                      onMoveDown={movable ? (id) => move(id, "down") : undefined}
                      canMoveUp={index > 0}
                      canMoveDown={index < group.length - 1}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
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

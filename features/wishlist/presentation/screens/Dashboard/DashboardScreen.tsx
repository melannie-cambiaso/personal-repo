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

// Full class strings (not interpolated tone names) so Tailwind can see every one.
const GROUPS: { key: keyof WishlistGroups; label: string; pill: string }[] = [
  { key: "high", label: PRIORITY_LABELS.high, pill: "bg-blush-300 text-blush-800" },
  { key: "medium", label: PRIORITY_LABELS.medium, pill: "bg-butter-300 text-butter-800" },
  { key: "low", label: PRIORITY_LABELS.low, pill: "bg-mist-300 text-mist-800" },
  { key: "owned", label: "Comprados", pill: "bg-sage-300 text-sage-800" },
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

      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        {isOwner && (
          <div className="mb-6 flex items-center justify-end">
            <AddButton onClick={() => setIsOpen(true)} />
          </div>
        )}

        <div className="border-blush-300 bg-blush-100 flex flex-col gap-5 rounded-3xl border-2 p-3 empty:hidden sm:p-5">
          {GROUPS.filter(({ key }) => groups[key].length > 0).map(({ key, label, pill }) => {
            const group = groups[key];
            // Only pending items have a manual order to change; owned ones never move.
            const movable = isOwner && key !== "owned";
            return (
              <section key={key} className="flex flex-col gap-2">
                <h2 className={`${pill} self-start rounded-full px-3 py-0.5 text-sm`}>{label}</h2>
                <ul className="border-blush-300 divide-blush-300 bg-cream-50/70 divide-y-2 divide-dashed overflow-hidden rounded-2xl border-2">
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

"use client";

import type { CategoryGroup, ShoppingItem } from "@/features/shopping-list/domain";
import { ShoppingItemRow } from "./ShoppingItemRow";

interface Props {
  grouped: CategoryGroup[];
  activeCategoryId: string | null;
  isOwner: boolean;
  onCheckItem: (id: string) => void;
  onEditItem: (item: ShoppingItem) => void;
  onDeleteItem: (item: ShoppingItem) => void;
}

export function ShoppingItemList({
  grouped,
  activeCategoryId,
  isOwner,
  onCheckItem,
  onEditItem,
  onDeleteItem,
}: Props) {
  if (grouped.length === 0) {
    return (
      <div className="text-brown-400 py-16 text-center">
        <p className="mb-1 text-4xl">🛒</p>
        <p className="text-sm">Todavía no hay categorías. ¡Creá la primera!</p>
      </div>
    );
  }

  const activeGroup =
    grouped.find((group) => group.category.id === activeCategoryId) ?? grouped[0];

  if (activeGroup.items.length === 0) {
    return (
      <div className="text-brown-400 py-16 text-center">
        <p className="mb-1 text-4xl">📭</p>
        <p className="text-sm">Esta categoría todavía no tiene productos.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {activeGroup.items.map((item) => (
        <ShoppingItemRow
          key={item.id}
          item={item}
          isOwner={isOwner}
          onCheck={onCheckItem}
          onEdit={onEditItem}
          onDelete={onDeleteItem}
        />
      ))}
    </div>
  );
}

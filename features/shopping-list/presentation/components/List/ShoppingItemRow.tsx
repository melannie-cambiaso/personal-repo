"use client";

import type { ShoppingItem } from "@/features/shopping-list/domain";

interface Props {
  item: ShoppingItem;
  isOwner: boolean;
  onCheck: (id: string) => void;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (item: ShoppingItem) => void;
}

export function ShoppingItemRow({ item, isOwner, onCheck, onEdit, onDelete }: Props) {
  return (
    <div
      data-testid="shopping-item-row"
      className="border-cream-300 flex items-center gap-3 rounded-2xl border bg-white px-5 py-3 shadow-sm"
    >
      <input
        type="checkbox"
        checked={item.checked}
        disabled={!isOwner}
        onChange={() => onCheck(item.id)}
        aria-label={`Marcar ${item.name} como comprado`}
        className="accent-brown-800 h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
      />
      <span className="text-brown-900 flex-1 text-sm font-medium">{item.name}</span>

      {isOwner && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Editar ${item.name}`}
            className="text-brown-500 hover:text-brown-800 min-h-11 min-w-11 inline-flex cursor-pointer items-center justify-center text-xs transition-colors"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`Eliminar ${item.name}`}
            className="text-brown-300 min-h-11 min-w-11 inline-flex cursor-pointer items-center justify-center text-sm transition-colors hover:text-red-500"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

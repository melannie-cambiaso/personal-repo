"use client";

import type { WishlistItem } from "@/features/wishlist/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

const moveButton =
  "text-brown-600 hover:bg-cream-300 flex h-8 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm transition-colors disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";

interface Props {
  item: WishlistItem;
  owned: boolean;
  /** Without it the checkbox is read-only (disabled). */
  onToggle?: (id: string) => void;
  /** Owner-only: a visitor gets neither, which hides edit and delete. */
  onEdit?: (item: WishlistItem) => void;
  onDelete?: (item: WishlistItem) => void;
  /** Owner-only, pending items: without them the reorder arrows are hidden. */
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function WishlistItemRow({
  item,
  owned,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: Props) {
  const titleClass = `block truncate text-left text-sm font-semibold ${
    owned ? "text-brown-400 line-through" : "text-brown-900"
  }`;

  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 ${onEdit ? "hover:bg-cream-50 cursor-pointer" : ""}`}
      onClick={onEdit ? () => onEdit(item) : undefined}
    >
      <input
        type="checkbox"
        aria-label={item.title}
        checked={owned}
        disabled={!onToggle}
        onChange={() => onToggle?.(item.id)}
        onClick={(e) => e.stopPropagation()}
        className="accent-brown-800 h-5 w-5 shrink-0 cursor-pointer disabled:cursor-default"
      />

      <div className="min-w-0 flex-1">
        {/* For owners the title is the keyboard path to the editor; its click
            bubbles to the row, which owns the handler. */}
        {onEdit ? (
          <button type="button" className={`w-full cursor-pointer ${titleClass}`}>
            {item.title}
          </button>
        ) : (
          <span className={titleClass}>{item.title}</span>
        )}
        <div className="mt-1 flex items-center gap-2">
          {item.price !== null ? (
            <span className={`text-xs font-bold ${owned ? "text-brown-400" : "text-brown-800"}`}>
              {formatCLP(item.price)}
            </span>
          ) : (
            <span className="text-xs font-semibold text-red-600">Falta precio</span>
          )}
        </div>
      </div>

      {(onMoveUp || onMoveDown) && (
        <div className="flex shrink-0">
          <button
            type="button"
            aria-label={`Subir ${item.title}`}
            disabled={!onMoveUp || !canMoveUp}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp?.(item.id);
            }}
            className={moveButton}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Bajar ${item.title}`}
            disabled={!onMoveDown || !canMoveDown}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown?.(item.id);
            }}
            className={moveButton}
          >
            ↓
          </button>
        </div>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir link de ${item.title}`}
          onClick={(e) => e.stopPropagation()}
          className="text-brown-600 hover:bg-cream-300 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition-colors"
        >
          ↗
        </a>
      )}
      {onDelete && (
        <button
          type="button"
          aria-label={`Eliminar ${item.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
          className="text-brown-400 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm transition-colors hover:bg-red-50 hover:text-red-600"
        >
          ✕
        </button>
      )}
    </li>
  );
}

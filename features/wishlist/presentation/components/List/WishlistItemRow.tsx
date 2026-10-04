"use client";

import type { WishlistItem } from "@/features/wishlist/domain";
import { formatCLP } from "@/shared/utils/formatCurrency";

// Small round buttons in the wishlist's blush tone; the row stays ~360px-friendly.
const roundButton =
  "border-blush-300 bg-cream-50 text-blush-800 hover:bg-blush-100 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm transition-colors";
const moveButton = `${roundButton} disabled:cursor-default disabled:opacity-30 disabled:hover:bg-cream-50`;

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
  const titleClass = `block truncate text-left ${
    owned ? "text-brown-400 line-through" : "text-brown-900"
  }`;

  return (
    <li
      className={`flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 ${onEdit ? "hover:bg-blush-100/50 cursor-pointer" : ""}`}
      onClick={onEdit ? () => onEdit(item) : undefined}
    >
      <input
        type="checkbox"
        aria-label={item.title}
        checked={owned}
        disabled={!onToggle}
        onChange={() => onToggle?.(item.id)}
        onClick={(e) => e.stopPropagation()}
        className="accent-blush-500 h-5 w-5 shrink-0 cursor-pointer disabled:cursor-default"
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
        <div className="flex items-center gap-2">
          {item.price !== null ? (
            <span
              className={`font-figure text-sm font-semibold ${owned ? "text-brown-400" : "text-brown-900"}`}
            >
              {formatCLP(item.price)}
            </span>
          ) : (
            <span className="text-sm text-red-600">Falta precio</span>
          )}
          {/* Outlined, never filled, so it reads as a label and not as a button.
              Truncates so a long tag cannot push the row past a ~360px screen. */}
          {item.tag && (
            <span
              className={`bg-cream-50 max-w-40 min-w-0 truncate rounded-full border-2 px-2.5 text-sm ${
                owned ? "border-brown-200 text-brown-400" : "border-blush-300 text-blush-800"
              }`}
            >
              {item.tag}
            </span>
          )}
        </div>
      </div>

      {(onMoveUp || onMoveDown) && (
        <div className="flex shrink-0 gap-1">
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
          className={roundButton}
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
          className={`${roundButton} hover:border-red-300 hover:text-red-600`}
        >
          ✕
        </button>
      )}
    </li>
  );
}

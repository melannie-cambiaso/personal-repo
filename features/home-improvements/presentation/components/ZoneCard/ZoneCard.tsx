"use client";

import type { Zone } from "@/features/home-improvements/domain/Zone";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import { ImprovementItemCard } from "../ItemCard/ImprovementItemCard";
import { AddButton } from "@/shared/components";
import { formatCLP } from "@/shared/utils/formatCurrency";

// Small round buttons in the zone's mist tone, shared with the item rows' look.
const roundButton =
  "border-mist-300 bg-cream-50 text-mist-800 hover:bg-mist-100 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm transition-colors";

interface Props {
  zone: Zone;
  items: ImprovementItem[];
  totalCost: number;
  pendingCount: number;
  isOwner: boolean;
  onEditZone: () => void;
  onDeleteZone: () => void;
  onAddItem: () => void;
  onEditItem: (item: ImprovementItem) => void;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export function ZoneCard({
  zone,
  items,
  totalCost,
  pendingCount,
  isOwner,
  onEditZone,
  onDeleteZone,
  onAddItem,
  onEditItem,
  onToggleItem,
  onDeleteItem,
}: Props) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border-2 border-mist-300 bg-mist-100 p-3 sm:p-5">
      {/* Zone header */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist-500 text-xl"
        >
          {zone.emoji || "🏠"}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-brown-900 text-2xl font-semibold tracking-tight break-words">
            {zone.name}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-3 text-sm text-mist-800">
            <span>
              {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
            </span>
            {totalCost > 0 && (
              <span>
                · <span className="font-figure text-brown-900">{formatCLP(totalCost)}</span>{" "}
                estimado
              </span>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={onEditZone}
              className={roundButton}
              aria-label="Editar zona"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={onDeleteZone}
              className={`${roundButton} hover:border-red-300 hover:text-red-600`}
              aria-label="Eliminar zona"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <p className="bg-cream-50/70 text-brown-400 rounded-2xl border-2 border-mist-300 px-4 py-4 text-center">
          Todavía no hay mejoras en esta zona.
        </p>
      ) : (
        <ul className="bg-cream-50/70 divide-y-2 divide-dashed divide-mist-300 overflow-hidden rounded-2xl border-2 border-mist-300">
          {items.map((item) => (
            <ImprovementItemCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              onToggle={() => onToggleItem(item.id)}
              onEdit={() => onEditItem(item)}
              onDelete={() => onDeleteItem(item.id)}
            />
          ))}
        </ul>
      )}
      {isOwner && (
        <div className="flex justify-center">
          <AddButton onClick={onAddItem} label="Agregar mejora" />
        </div>
      )}
    </section>
  );
}

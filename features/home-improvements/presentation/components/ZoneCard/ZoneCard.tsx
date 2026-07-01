"use client";

import type { Zone } from "@/features/home-improvements/domain/Zone";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import { ImprovementItemCard } from "../ItemCard/ImprovementItemCard";
import { AddButton } from "@/shared/components";
import { formatCLP } from "@/shared/utils/formatCurrency";

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
    <section className="border-cream-300 bg-cream-50 shadow-card rounded-2xl border">
      {/* Zone header */}
      <div className="border-cream-300 flex items-center gap-3 border-b px-5 py-4">
        {zone.emoji && <span className="text-2xl">{zone.emoji}</span>}
        <div className="flex-1">
          <h2 className="font-dancing text-brown-900 text-xl font-bold">{zone.name}</h2>
          <div className="text-brown-400 mt-0.5 flex gap-3 text-xs">
            <span>
              {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
            </span>
            {totalCost > 0 && <span>· {formatCLP(totalCost)} estimado</span>}
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onEditZone}
              className="text-brown-400 hover:bg-cream-300 hover:text-brown-800 cursor-pointer rounded-lg px-2 py-1 text-xs transition-colors"
              aria-label="Editar zona"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={onDeleteZone}
              className="text-brown-400 hover:bg-cream-300 cursor-pointer rounded-lg px-2 py-1 text-xs transition-colors hover:text-red-600"
              aria-label="Eliminar zona"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2 p-4">
        {items.length === 0 && (
          <p className="text-brown-400 py-4 text-center text-sm">
            Todavía no hay mejoras en esta zona.
          </p>
        )}
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
        {isOwner && (
          <div className="mt-2 flex justify-center">
            <AddButton onClick={onAddItem} label="Agregar mejora" />
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import type { ImprovementItem, ImprovementType } from "@/features/home-improvements/domain/ImprovementItem";
import { fmt } from "@/shared/utils/formatCurrency";

const typeBadge: Record<ImprovementType, string> = {
  "Decoración":   "bg-cat-cloth text-white",
  "Organización": "bg-cat-books text-white",
  "Reparación":   "bg-cat-food text-white",
  "Instalación":  "bg-cat-tech text-white",
  "Otro":         "bg-cat-home text-white",
};

interface Props {
  item: ImprovementItem;
  isOwner: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ImprovementItemCard({ item, isOwner, onToggle, onEdit, onDelete }: Props) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-cream-300 bg-white px-4 py-3 shadow-card transition-opacity ${item.done ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-2 transition-colors ${item.done ? "border-brown-800 bg-brown-800" : "border-cream-400 bg-white hover:border-brown-600"}`}
        aria-label={item.done ? "Marcar como pendiente" : "Marcar como hecho"}
      >
        {item.done && <span className="flex h-full items-center justify-center text-xs text-white">✓</span>}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={`text-2xs rounded-full px-2 py-0.5 font-bold uppercase tracking-badge ${typeBadge[item.type]}`}>
            {item.type}
          </span>
          {item.plannedMonth && !item.done && (
            <span className="text-2xs rounded-full bg-cream-300 px-2 py-0.5 font-semibold text-brown-700">
              📅 {new Date(`${item.plannedMonth}-01T12:00:00`).toLocaleString("es-AR", { month: "short", year: "numeric" })}
            </span>
          )}
          {item.estimatedCost !== null && (
            <span className="text-2xs font-bold text-brown-800">
              {item.quantity && item.quantity > 1
                ? `${fmt(item.estimatedCost)} x${item.quantity} = ${fmt(item.estimatedCost * item.quantity)}`
                : fmt(item.estimatedCost)}
            </span>
          )}
        </div>
        <p className={`text-sm font-semibold leading-snug text-brown-900 ${item.done ? "line-through" : ""}`}>
          {item.title}
        </p>
        {item.description && (
          <p className="mt-1 text-xs leading-relaxed text-brown-600">{item.description}</p>
        )}
        {item.purchaseUrl && (
          <a
            href={item.purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className="text-2xs mt-1.5 inline-block font-bold text-brown-800 underline underline-offset-2 hover:text-brown-600"
            onClick={(e) => e.stopPropagation()}
          >
            Ver dónde comprarlo →
          </a>
        )}
      </div>

      {isOwner && (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer rounded-lg px-2 py-1 text-xs text-brown-400 transition-colors hover:bg-cream-300 hover:text-brown-800"
            aria-label="Editar"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="cursor-pointer rounded-lg px-2 py-1 text-xs text-brown-400 transition-colors hover:bg-cream-300 hover:text-red-600"
            aria-label="Eliminar"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}

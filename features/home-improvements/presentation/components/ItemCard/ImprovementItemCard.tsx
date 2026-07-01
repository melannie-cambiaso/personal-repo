"use client";

import type {
  ImprovementItem,
  ImprovementType,
} from "@/features/home-improvements/domain/ImprovementItem";
import { formatCLP } from "@/shared/utils/formatCurrency";

const typeBadge: Record<ImprovementType, string> = {
  Decoración: "bg-cat-cloth text-white",
  Organización: "bg-cat-books text-white",
  Reparación: "bg-cat-food text-white",
  Instalación: "bg-cat-tech text-white",
  Otro: "bg-cat-home text-white",
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
    <div
      className={`border-cream-300 shadow-card flex items-start gap-3 rounded-xl border bg-white px-4 py-3 transition-opacity ${item.done ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-2 transition-colors ${item.done ? "border-brown-800 bg-brown-800" : "border-cream-400 hover:border-brown-600 bg-white"}`}
        aria-label={item.done ? "Marcar como pendiente" : "Marcar como hecho"}
      >
        {item.done && (
          <span className="flex h-full items-center justify-center text-xs text-white">✓</span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={`text-2xs tracking-badge rounded-full px-2 py-0.5 font-bold uppercase ${typeBadge[item.type]}`}
          >
            {item.type}
          </span>
          {item.plannedMonth && !item.done && (
            <span className="text-2xs bg-cream-300 text-brown-700 rounded-full px-2 py-0.5 font-semibold">
              📅{" "}
              {new Date(`${item.plannedMonth}-01T12:00:00`).toLocaleString("es-CL", {
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          {item.estimatedCost !== null && (
            <span className="text-2xs text-brown-800 font-bold">
              {item.quantity && item.quantity > 1
                ? `${formatCLP(item.estimatedCost)} x${item.quantity} = ${formatCLP(item.estimatedCost * item.quantity)}`
                : formatCLP(item.estimatedCost)}
            </span>
          )}
        </div>
        <p
          className={`text-brown-900 text-sm leading-snug font-semibold ${item.done ? "line-through" : ""}`}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="text-brown-600 mt-1 text-xs leading-relaxed">{item.description}</p>
        )}
        {item.purchaseUrl && (
          <a
            href={item.purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className="text-2xs text-brown-800 hover:text-brown-600 mt-1.5 inline-block font-bold underline underline-offset-2"
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
            className="text-brown-400 hover:bg-cream-300 hover:text-brown-800 cursor-pointer rounded-lg px-2 py-1 text-xs transition-colors"
            aria-label="Editar"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-brown-400 hover:bg-cream-300 cursor-pointer rounded-lg px-2 py-1 text-xs transition-colors hover:text-red-600"
            aria-label="Eliminar"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}

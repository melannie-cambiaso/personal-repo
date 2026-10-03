"use client";

import type {
  ImprovementItem,
  ImprovementType,
} from "@/features/home-improvements/domain/ImprovementItem";
import { formatCLP } from "@/shared/utils/formatCurrency";

// Type pills are outlined so they never read as the filled status pill next to them.
const typeBadge: Record<ImprovementType, string> = {
  Decoración: "border-lilac-300 text-lilac-800",
  Organización: "border-sage-300 text-sage-800",
  Reparación: "border-blush-300 text-blush-800",
  Instalación: "border-mist-300 text-mist-800",
  Otro: "border-cream-400 text-brown-600",
};

const roundButton =
  "border-mist-300 bg-cream-50 text-mist-800 hover:bg-mist-100 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm transition-colors";

interface Props {
  item: ImprovementItem;
  isOwner: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ImprovementItemCard({ item, isOwner, onToggle, onEdit, onDelete }: Props) {
  return (
    <li
      className={`flex items-start gap-2 px-3 py-3 transition-opacity sm:gap-3 sm:px-4 ${item.done ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors ${item.done ? "border-sage-500 bg-sage-500 text-sage-800" : "bg-cream-50 border-mist-300 hover:border-mist-500"}`}
        aria-label={item.done ? "Marcar como pendiente" : "Marcar como hecho"}
      >
        {item.done && <span className="text-sm">✓</span>}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span
            className={`${item.done ? "bg-sage-500 text-sage-800" : "bg-butter-500 text-butter-800"} rounded-full px-2.5 py-0.5 text-sm`}
          >
            {item.done ? "Hecho" : "Pendiente"}
          </span>
          <span
            className={`bg-cream-50 rounded-full border-2 px-2.5 text-sm ${typeBadge[item.type]}`}
          >
            {item.type}
          </span>
        </div>
        <p className={`text-brown-900 leading-snug break-words ${item.done ? "line-through" : ""}`}>
          {item.title}
        </p>
        {item.estimatedCost !== null && (
          <p className="font-figure text-brown-900 mt-0.5 text-sm font-semibold">
            {item.quantity && item.quantity > 1
              ? `${formatCLP(item.estimatedCost)} x${item.quantity} = ${formatCLP(item.estimatedCost * item.quantity)}`
              : formatCLP(item.estimatedCost)}
          </p>
        )}
        {item.description && (
          <p className="text-brown-600 mt-1 text-sm leading-relaxed break-words">
            {item.description}
          </p>
        )}
        {item.purchaseUrl && (
          <a
            href={item.purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-brown-900 mt-1.5 inline-block text-sm text-mist-800 underline decoration-mist-500 underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            Ver dónde comprarlo →
          </a>
        )}
      </div>

      {isOwner && (
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={onEdit} className={roundButton} aria-label="Editar">
            ✏️
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${roundButton} hover:border-red-300 hover:text-red-600`}
            aria-label="Eliminar"
          >
            🗑
          </button>
        </div>
      )}
    </li>
  );
}

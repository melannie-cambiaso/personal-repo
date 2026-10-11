"use client";

import type {
  ImprovementItem,
  ImprovementType,
} from "@/features/home-improvements/domain/ImprovementItem";
import { formatCLP } from "@/shared/utils/formatCurrency";

// Type pills are outlined so they never read as the filled status pill next to them.
const typeBadge: Record<ImprovementType, string> = {
  Decoración: "border-surface-300 text-brand-600",
  Organización: "border-surface-300 text-success-800",
  Reparación: "border-surface-300 text-danger-800",
  Instalación: "border-surface-300 text-info-800",
  Otro: "border-surface-400 text-ink-600",
};

const roundButton =
  "border-surface-300 bg-surface-50 text-info-800 hover:bg-surface-100 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm transition-colors";

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
        className={`mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors ${item.done ? "border-success-500 bg-success-500 text-success-800" : "bg-surface-50 border-surface-300 hover:border-info-500"}`}
        aria-label={item.done ? "Marcar como pendiente" : "Marcar como hecho"}
      >
        {item.done && <span className="text-sm">✓</span>}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span
            className={`${item.done ? "bg-success-500 text-success-800" : "bg-warning-500 text-warning-800"} rounded-full px-2.5 py-0.5 text-sm`}
          >
            {item.done ? "Hecho" : "Pendiente"}
          </span>
          <span
            className={`bg-surface-50 rounded-full border-2 px-2.5 text-sm ${typeBadge[item.type]}`}
          >
            {item.type}
          </span>
        </div>
        <p className={`text-ink-900 leading-snug break-words ${item.done ? "line-through" : ""}`}>
          {item.title}
        </p>
        {item.estimatedCost !== null && (
          <p className="font-figure text-ink-900 mt-0.5 text-sm font-semibold">
            {item.quantity && item.quantity > 1
              ? `${formatCLP(item.estimatedCost)} x${item.quantity} = ${formatCLP(item.estimatedCost * item.quantity)}`
              : formatCLP(item.estimatedCost)}
          </p>
        )}
        {item.description && (
          <p className="text-ink-600 mt-1 text-sm leading-relaxed break-words">
            {item.description}
          </p>
        )}
        {item.purchaseUrl && (
          <a
            href={item.purchaseUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink-900 mt-1.5 inline-block text-sm text-info-800 underline decoration-info-500 underline-offset-2"
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

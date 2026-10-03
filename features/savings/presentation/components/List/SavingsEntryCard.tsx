"use client";

import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  entry: SavingsEntry;
  isOwner: boolean;
  onEdit: (entry: SavingsEntry) => void;
  onMarkReplenished: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavingsEntryCard({ entry, isOwner, onEdit, onMarkReplenished, onDelete }: Props) {
  const isDeposito = entry.type === "deposito";
  // Full class strings (not interpolated tone names) so Tailwind can see every one.
  const tone = isDeposito
    ? {
        card: "border-sage-300 bg-sage-100",
        hover: "hover:border-sage-500",
        pill: "bg-sage-300 text-sage-800",
      }
    : {
        card: "border-blush-300 bg-blush-100",
        hover: "hover:border-blush-500",
        pill: "bg-blush-300 text-blush-800",
      };

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border-2 px-4 py-3 transition-all ${isOwner ? `${tone.hover} hover:shadow-card-hover cursor-pointer` : ""} ${tone.card}`}
      onClick={() => isOwner && onEdit(entry)}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${tone.pill}`}>
            {isDeposito ? "Depósito" : "Gasto"}
          </span>
          <span className="font-figure text-brown-500 text-xs">{entry.date}</span>
          {isOwner && !isDeposito && entry.toReplenish && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkReplenished(entry.id);
              }}
              className="border-blush-500 bg-cream-50 text-blush-800 hover:bg-blush-300 cursor-pointer rounded-full border-2 px-2 py-0.5 text-xs transition-colors"
            >
              A reponer ✓
            </button>
          )}
        </div>
        <p
          className={`font-figure text-lg font-bold ${isDeposito ? "text-green-700" : "text-red-700"}`}
        >
          {isDeposito ? "+" : "-"}
          {formatCLP(entry.amount)}
        </p>
        {entry.notes && <p className="text-brown-600 text-sm break-words">{entry.notes}</p>}
      </div>
      {isOwner && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          className="text-brown-400 cursor-pointer text-sm transition-colors hover:text-red-500"
          aria-label="Eliminar"
        >
          ✕
        </button>
      )}
    </div>
  );
}

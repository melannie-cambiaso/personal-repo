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

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm transition-all ${isOwner ? "hover:border-brown-300 hover:shadow-card-hover cursor-pointer" : ""} ${isDeposito ? "border-green-200" : "border-red-200"}`}
      onClick={() => isOwner && onEdit(entry)}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xs rounded-full px-2 py-0.5 font-semibold ${isDeposito ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {isDeposito ? "Depósito" : "Gasto"}
          </span>
          <span className="text-brown-400 text-xs">{entry.date}</span>
          {!isDeposito && entry.toReplenish && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkReplenished(entry.id);
              }}
              className="text-2xs rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 transition-colors hover:bg-amber-200"
            >
              A reponer ✓
            </button>
          )}
        </div>
        <p className={`text-lg font-bold ${isDeposito ? "text-green-700" : "text-red-700"}`}>
          {isDeposito ? "+" : "-"}
          {formatCLP(entry.amount)}
        </p>
        {entry.notes && <p className="text-brown-400 text-xs">{entry.notes}</p>}
      </div>
      {isOwner && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          className="text-brown-300 cursor-pointer text-sm transition-colors hover:text-red-500"
          aria-label="Eliminar"
        >
          ✕
        </button>
      )}
    </div>
  );
}

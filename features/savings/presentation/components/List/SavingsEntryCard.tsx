"use client";

import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";

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
      className={`flex items-start justify-between gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm transition-all ${isOwner ? "cursor-pointer hover:border-brown-300 hover:shadow-card-hover" : ""} ${isDeposito ? "border-green-200" : "border-red-200"}`}
      onClick={() => isOwner && onEdit(entry)}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${isDeposito ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {isDeposito ? "Depósito" : "Gasto"}
          </span>
          <span className="text-xs text-brown-400">{entry.date}</span>
          {!isDeposito && entry.toReplenish && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMarkReplenished(entry.id); }}
              className="rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-semibold text-amber-700 transition-colors hover:bg-amber-200"
            >
              A reponer ✓
            </button>
          )}
        </div>
        <p className={`text-lg font-bold ${isDeposito ? "text-green-700" : "text-red-700"}`}>
          {isDeposito ? "+" : "-"}${entry.amount.toLocaleString("es-AR")}
        </p>
        {entry.notes && <p className="text-xs text-brown-400">{entry.notes}</p>}
      </div>
      {isOwner && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
          className="cursor-pointer text-sm text-brown-300 transition-colors hover:text-red-500"
          aria-label="Eliminar"
        >
          ✕
        </button>
      )}
    </div>
  );
}

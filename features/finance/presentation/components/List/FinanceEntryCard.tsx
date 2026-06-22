"use client";

import type { FinanceEntry } from "@/features/finance/domain/FinanceEntry";

interface Props {
  entry: FinanceEntry;
  isOwner: boolean;
  onEdit: (entry: FinanceEntry) => void;
  onDelete: (id: string) => void;
}

export function FinanceEntryCard({ entry, isOwner, onEdit, onDelete }: Props) {
  const fmt = (n: number) => `$${n.toLocaleString("es-AR")}`;
  const isIncome = entry.type === "income";

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brown-900 truncate">{entry.category}</span>
          <span className="shrink-0 rounded-full bg-cream-200 px-2 py-0.5 text-2xs text-brown-500">{entry.group}</span>
        </div>
        {entry.description && (
          <p className="mt-0.5 text-xs text-brown-400 truncate">{entry.description}</p>
        )}
      </div>
      <span className={`shrink-0 text-sm font-bold ${isIncome ? "text-green-600" : "text-brown-900"}`}>
        {isIncome ? "+" : "-"}{fmt(entry.amount)}
      </span>
      {isOwner && (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="cursor-pointer rounded-lg p-1.5 text-brown-400 transition-colors hover:bg-cream-200 hover:text-brown-700"
            aria-label="Editar"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="cursor-pointer rounded-lg p-1.5 text-brown-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Eliminar"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

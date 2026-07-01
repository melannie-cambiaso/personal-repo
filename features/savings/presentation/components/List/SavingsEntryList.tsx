"use client";

import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { SavingsEntryCard } from "./SavingsEntryCard";

interface Props {
  entries: SavingsEntry[];
  isOwner: boolean;
  onEdit: (entry: SavingsEntry) => void;
  onMarkReplenished: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavingsEntryList({ entries, isOwner, onEdit, onMarkReplenished, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-brown-400 py-16 text-center">
        <p className="mb-1 text-4xl">💰</p>
        <p className="text-sm">Todavía no hay registros. ¡Agregá el primero!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <SavingsEntryCard
          key={entry.id}
          entry={entry}
          isOwner={isOwner}
          onEdit={onEdit}
          onMarkReplenished={onMarkReplenished}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

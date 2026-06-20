"use client";

import { useState } from "react";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { useSavings } from "../../hooks/useSavings";
import {
  SavingsSummaryCards,
  SavingsEntryList,
  AddEntryModal,
  EditEntryModal,
  DeleteEntryConfirmModal,
} from "../../components";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { AddButton } from "@/shared/components/AddButton/AddButton";

interface Props {
  initialEntries: SavingsEntry[];
  isOwner: boolean;
  onSave: (entries: SavingsEntry[]) => Promise<void> | void;
}

export function SavingsScreen({ initialEntries, isOwner, onSave }: Props) {
  const { entries, balance, totalToReplenish, totalDepositos, totalGastos, addEntry, editEntry, deleteEntry, markReplenished } =
    useSavings({ initialEntries, onSave });

  const [addOpen, setAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavingsEntry | null>(null);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tu bolsillo" title="Ahorros">
        <div className="flex justify-center gap-6 text-sm text-cream-100/80">
          <span>{entries.length} registro{entries.length !== 1 ? "s" : ""}</span>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="mb-8">
          <SavingsSummaryCards balance={balance} totalToReplenish={totalToReplenish} totalDepositos={totalDepositos} totalGastos={totalGastos} />
        </div>

        <div className="mb-6 flex justify-end">
          {isOwner && <AddButton onClick={() => setAddOpen(true)} label="Agregar registro" />}
        </div>

        <SavingsEntryList
          entries={entries}
          isOwner={isOwner}
          onEdit={setEditingEntry}
          onMarkReplenished={markReplenished}
          onDelete={(id) => {
            const entry = entries.find((e) => e.id === id);
            if (entry) setPendingDelete(entry);
          }}
        />
      </div>

      <AddEntryModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(entry) => { addEntry(entry); setAddOpen(false); }}
      />
      <EditEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={(entry) => { editEntry(entry); setEditingEntry(null); }}
      />
      <DeleteEntryConfirmModal
        entry={pendingDelete}
        onConfirm={() => { if (pendingDelete) { deleteEntry(pendingDelete.id); setPendingDelete(null); } }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}

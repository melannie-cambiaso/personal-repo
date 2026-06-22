"use client";

import { useState } from "react";
import type { FinanceEntry } from "@/features/finance/domain/FinanceEntry";
import { useFinance } from "../../hooks/useFinance";
import {
  FinanceMonthNav,
  FinanceMonthlySummary,
  FinanceEntryList,
  AddEntryModal,
  EditEntryModal,
  DeleteEntryConfirmModal,
} from "../../components";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { AddButton } from "@/shared/components/AddButton/AddButton";

interface Props {
  initialEntries: FinanceEntry[];
  isOwner: boolean;
  onSave: (entries: FinanceEntry[]) => Promise<void> | void;
}

export function FinanceScreen({ initialEntries, isOwner, onSave }: Props) {
  const { entries, selectedMonth, summary, groupedByDay, goToPrevMonth, goToNextMonth, addEntry, editEntry, deleteEntry } =
    useFinance({ initialEntries, onSave });

  const [addOpen, setAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FinanceEntry | null>(null);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tus finanzas" title="Finanzas">
        <div className="flex justify-center gap-6 text-sm text-cream-100/80">
          <span>{entries.length} registro{entries.length !== 1 ? "s" : ""}</span>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <FinanceMonthNav selectedMonth={selectedMonth} onPrev={goToPrevMonth} onNext={goToNextMonth} />

        <div className="mb-8">
          <FinanceMonthlySummary summary={summary} />
        </div>

        <div className="mb-6 flex justify-end">
          {isOwner && <AddButton onClick={() => setAddOpen(true)} label="Agregar registro" />}
        </div>

        <FinanceEntryList
          groupedByDay={groupedByDay}
          isOwner={isOwner}
          onEdit={setEditingEntry}
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

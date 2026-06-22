"use client";

import { useState, useEffect } from "react";
import type { FinanceEntry } from "@/features/finance/domain/FinanceEntry";
import { getBudgetForMonth } from "@/features/finance/data/financeActions";
import { useFinance } from "../../hooks/useFinance";
import {
  BudgetTab,
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
  initialBudget: Record<string, number>;
  isOwner: boolean;
  onSave: (entries: FinanceEntry[]) => Promise<void> | void;
  onSaveBudget: (month: string, budget: Record<string, number>) => Promise<void>;
}

type Tab = "registros" | "presupuesto";

const tabClass = (active: boolean) =>
  active
    ? "border-b-2 border-brown-800 pb-2 text-sm font-semibold text-brown-900"
    : "pb-2 text-sm font-semibold text-brown-400 hover:text-brown-700 transition-colors";

export function FinanceScreen({ initialEntries, initialBudget, isOwner, onSave, onSaveBudget }: Props) {
  const { entries, selectedMonth, summary, groupedByDay, goToPrevMonth, goToNextMonth, addEntry, editEntry, deleteEntry } =
    useFinance({ initialEntries, onSave });

  const [activeTab, setActiveTab] = useState<Tab>("registros");
  const [monthBudget, setMonthBudget] = useState<Record<string, number>>(initialBudget);
  const [budgetLoadedFor, setBudgetLoadedFor] = useState(selectedMonth);

  useEffect(() => {
    if (budgetLoadedFor === selectedMonth) return;
    getBudgetForMonth(selectedMonth).then((b) => {
      setMonthBudget(b);
      setBudgetLoadedFor(selectedMonth);
    });
  }, [selectedMonth, budgetLoadedFor]);

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

        <div className="mb-6 flex gap-6 border-b border-cream-300">
          <button className={tabClass(activeTab === "registros")} onClick={() => setActiveTab("registros")}>
            Registros
          </button>
          <button className={tabClass(activeTab === "presupuesto")} onClick={() => setActiveTab("presupuesto")}>
            Presupuesto
          </button>
        </div>

        {activeTab === "registros" && (
          <>
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
          </>
        )}

        {activeTab === "presupuesto" && (
          <BudgetTab
            key={budgetLoadedFor}
            initialBudget={monthBudget}
            byCategory={summary.byCategory}
            selectedMonth={selectedMonth}
            onSave={(b) => onSaveBudget(selectedMonth, b)}
          />
        )}
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

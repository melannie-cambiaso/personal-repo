"use client";

import { useState } from "react";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import type { SavingsGoal } from "@/features/savings/domain/SavingsGoal";
import type { SavingsPeriod } from "@/features/savings/domain/SavingsPeriod";
import type { GoalWithProgress } from "@/features/savings/domain";
import { useSavings } from "../../hooks/useSavings";
import { useSavingsGoals } from "../../hooks/useSavingsGoals";
import {
  SavingsSummaryCards,
  SavingsEntryList,
  SavingsGoalList,
  AddEntryModal,
  EditEntryModal,
  DeleteEntryConfirmModal,
  AddGoalModal,
  EditGoalModal,
  DeleteGoalConfirmModal,
  MonthlyBreakdown,
  ArchivedPeriodList,
  ArchivePeriodModal,
} from "../../components";
import { PageHeader, AddButton, Button } from "@/shared/components";

type TabKey = "history" | "goals" | "monthly" | "archived";

const TABS: { key: TabKey; label: string }[] = [
  { key: "history", label: "Historial" },
  { key: "goals", label: "Metas" },
  { key: "monthly", label: "Por mes" },
  { key: "archived", label: "Archivados" },
];

interface Props {
  initialEntries: SavingsEntry[];
  initialGoals?: SavingsGoal[];
  isOwner: boolean;
  onSave: (entries: SavingsEntry[]) => Promise<void> | void;
  onSaveGoals?: (goals: SavingsGoal[]) => Promise<void> | void;
  period?: SavingsPeriod;
  periods?: SavingsPeriod[];
  allEntries?: SavingsEntry[];
  onArchive?: (data: { initialAmount?: number; label?: string }) => Promise<void> | void;
}

export function SavingsScreen({
  initialEntries,
  initialGoals = [],
  isOwner,
  onSave,
  onSaveGoals,
  period,
  periods = [],
  allEntries = [],
  onArchive,
}: Props) {
  const {
    entries,
    balance,
    totalToReplenish,
    totalDepositos,
    totalGastos,
    addEntry,
    editEntry,
    deleteEntry,
    markReplenished,
  } = useSavings({ initialEntries, onSave, period });

  const { distributed, handleAdd, handleEdit, handleDelete, handleReorder, handleToggleDone } =
    useSavingsGoals({
      initialGoals,
      balance,
      entries,
      onSave: onSaveGoals ?? (() => {}),
    });

  const activeGoals = distributed.filter((g) => g.isDone !== true);

  const [activeTab, setActiveTab] = useState<TabKey>("history");

  // Entry modal state
  const [addOpen, setAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavingsEntry | null>(null);

  // Archive period modal state
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Goal modal state
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [pendingDeleteGoal, setPendingDeleteGoal] = useState<GoalWithProgress | null>(null);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tu bolsillo" title="Ahorros">
        <div className="flex justify-center">
          <div className="border-butter-300 bg-cream-50/70 flex min-w-24 flex-col items-center rounded-2xl border-2 px-4 py-2">
            <span className="font-figure text-brown-900 text-lg font-semibold">
              {entries.length}
            </span>
            <span className="text-brown-500 text-sm">
              registro{entries.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer rounded-full border-2 px-4 py-1.5 transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 bg-brand-100 text-brand-600"
                  : "border-cream-300 bg-cream-50 text-brown-600 hover:bg-cream-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "history" && (
          <>
            <div className="mb-8">
              <SavingsSummaryCards
                balance={balance}
                totalToReplenish={totalToReplenish}
                totalDepositos={totalDepositos}
                totalGastos={totalGastos}
                initialAmount={period?.initialAmount}
              />
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              {isOwner ? (
                <Button type="button" variant="secondary" onPress={() => setArchiveOpen(true)}>
                  Archivar período
                </Button>
              ) : (
                <span />
              )}
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
          </>
        )}

        {activeTab === "goals" && (
          <>
            <div className="mb-6 flex justify-end">
              {isOwner && <AddButton onClick={() => setAddGoalOpen(true)} label="Agregar meta" />}
            </div>

            <SavingsGoalList
              goals={distributed}
              isOwner={isOwner}
              onEdit={setEditingGoal}
              onDelete={(id) => {
                const goal = distributed.find((g) => g.id === id);
                if (goal) setPendingDeleteGoal(goal);
              }}
              onReorder={handleReorder}
              onToggleDone={handleToggleDone}
            />
          </>
        )}

        {activeTab === "monthly" && <MonthlyBreakdown entries={entries} />}

        {activeTab === "archived" && <ArchivedPeriodList periods={periods} entries={allEntries} />}
      </div>

      <AddEntryModal
        key={addOpen ? "entry-open" : "entry-closed"}
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(entry) => {
          addEntry(entry);
          setAddOpen(false);
        }}
        goals={activeGoals}
      />
      <EditEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={(entry) => {
          editEntry(entry);
          setEditingEntry(null);
        }}
      />
      <DeleteEntryConfirmModal
        entry={pendingDelete}
        onConfirm={() => {
          if (pendingDelete) {
            deleteEntry(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <AddGoalModal
        key={addGoalOpen ? "goal-open" : "goal-closed"}
        isOpen={addGoalOpen}
        onClose={() => setAddGoalOpen(false)}
        onAdd={(data) => {
          handleAdd(data);
          setAddGoalOpen(false);
        }}
      />
      <EditGoalModal
        key={editingGoal?.id}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onSave={(id, data) => {
          handleEdit(id, data);
          setEditingGoal(null);
        }}
      />
      <DeleteGoalConfirmModal
        goal={pendingDeleteGoal}
        onConfirm={() => {
          if (pendingDeleteGoal) {
            handleDelete(pendingDeleteGoal.id);
            setPendingDeleteGoal(null);
          }
        }}
        onCancel={() => setPendingDeleteGoal(null)}
      />

      <ArchivePeriodModal
        key={archiveOpen ? "archive-open" : "archive-closed"}
        isOpen={archiveOpen}
        entries={entries}
        onClose={() => setArchiveOpen(false)}
        onConfirm={(data) => {
          void onArchive?.(data);
          setArchiveOpen(false);
        }}
      />
    </main>
  );
}

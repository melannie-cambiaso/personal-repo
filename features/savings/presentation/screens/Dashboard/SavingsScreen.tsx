"use client";

import { useState } from "react";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import type { SavingsGoal } from "@/features/savings/domain/SavingsGoal";
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
} from "../../components";
import { PageHeader, AddButton } from "@/shared/components";

interface Props {
  initialEntries: SavingsEntry[];
  initialGoals?: SavingsGoal[];
  isOwner: boolean;
  onSave: (entries: SavingsEntry[]) => Promise<void> | void;
  onSaveGoals?: (goals: SavingsGoal[]) => Promise<void> | void;
}

export function SavingsScreen({
  initialEntries,
  initialGoals = [],
  isOwner,
  onSave,
  onSaveGoals,
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
  } = useSavings({ initialEntries, onSave });

  const { distributed, handleAdd, handleEdit, handleDelete, handleReorder, handleToggleDone } =
    useSavingsGoals({
      initialGoals,
      balance,
      onSave: onSaveGoals ?? (() => {}),
    });

  const [activeTab, setActiveTab] = useState<"history" | "goals">("history");

  // Entry modal state
  const [addOpen, setAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavingsEntry | null>(null);

  // Goal modal state
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [pendingDeleteGoal, setPendingDeleteGoal] = useState<GoalWithProgress | null>(null);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tu bolsillo" title="Ahorros">
        <div className="text-cream-100/80 flex justify-center gap-6 text-sm">
          <span>
            {entries.length} registro{entries.length !== 1 ? "s" : ""}
          </span>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="border-cream-300 mb-8 flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "history" ? "border-brown-800 text-brown-900 border-b-2" : "text-brown-400 hover:text-brown-700"}`}
          >
            Historial
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("goals")}
            className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "goals" ? "border-brown-800 text-brown-900 border-b-2" : "text-brown-400 hover:text-brown-700"}`}
          >
            Metas
          </button>
        </div>

        {activeTab === "history" && (
          <>
            <div className="mb-8">
              <SavingsSummaryCards
                balance={balance}
                totalToReplenish={totalToReplenish}
                totalDepositos={totalDepositos}
                totalGastos={totalGastos}
              />
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
      </div>

      <AddEntryModal
        key={addOpen ? "entry-open" : "entry-closed"}
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(entry) => {
          addEntry(entry);
          setAddOpen(false);
        }}
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
    </main>
  );
}

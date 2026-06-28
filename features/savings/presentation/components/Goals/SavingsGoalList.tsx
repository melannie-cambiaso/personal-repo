"use client";

import { useState } from "react";
import type { GoalWithProgress } from "@/features/savings/domain";
import { SavingsGoalCard } from "./SavingsGoalCard";

interface Props {
  goals: GoalWithProgress[];
  surplus: number;
  isOwner: boolean;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onAddFirst: () => void;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export function SavingsGoalList({ goals, surplus, isOwner, onEdit, onDelete, onReorder, onAddFirst }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDropOn = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const ids = goals.map((g) => g.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetId);
    const newIds = [...ids];
    newIds.splice(fromIndex, 1);
    newIds.splice(toIndex, 0, draggedId);
    onReorder(newIds);
    setDraggedId(null);
  };

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm text-brown-400">Todavía no tenés metas. ¡Agregá una!</p>
        {isOwner && (
          <button type="button" onClick={onAddFirst} className={btnPrimary}>
            Agregar meta
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {goals.map((goal) => (
        <div
          key={goal.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropOn(goal.id)}
        >
          <SavingsGoalCard
            goal={goal}
            isOwner={isOwner}
            onEdit={onEdit}
            onDelete={onDelete}
            dragHandleProps={{
              draggable: true,
              onDragStart: () => setDraggedId(goal.id),
              onDragEnd: () => setDraggedId(null),
            }}
          />
        </div>
      ))}
      {surplus > 0 && (
        <p className="mt-1 text-right text-sm text-brown-400">
          Excedente: {fmt(surplus)}
        </p>
      )}
    </div>
  );
}

const btnPrimary =
  "cursor-pointer rounded-lg bg-brown-800 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700";

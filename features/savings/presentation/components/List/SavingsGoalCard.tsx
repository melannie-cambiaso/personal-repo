"use client";

import type { GoalWithProgress } from "@/features/savings/domain";
import { ProgressBar } from "@/shared/components";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  goal: GoalWithProgress;
  isOwner: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleDone: (id: string) => void;
}

export function SavingsGoalCard({
  goal,
  isOwner,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleDone,
}: Props) {
  const isDone = goal.isDone === true;

  return (
    <div
      data-testid="savings-goal-card"
      aria-disabled={isDone}
      className={`flex flex-col gap-3 rounded-2xl border bg-white px-5 py-4 shadow-sm transition-all ${isOwner ? "hover:border-brown-300 hover:shadow-card-hover cursor-pointer" : ""} border-cream-300 ${isDone ? "opacity-50" : ""}`}
      onClick={() => isOwner && onEdit(goal)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={`text-brown-900 text-sm font-semibold ${isDone ? "line-through" : ""}`}
          >
            {goal.name}
          </span>
          <ProgressBar value={goal.progress} />
          <span className="text-brown-400 text-xs">
            {formatCLP(goal.currentAmount)} / {formatCLP(goal.targetAmount)}
          </span>
        </div>

        {isOwner && (
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={isFirst}
              aria-label="Subir prioridad"
              className="text-brown-500 hover:text-brown-800 cursor-pointer text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={isLast}
              aria-label="Bajar prioridad"
              className="text-brown-500 hover:text-brown-800 cursor-pointer text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            >
              ▼
            </button>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone(goal.id);
            }}
            aria-pressed={isDone}
            aria-label={isDone ? "Reabrir" : "Marcar como hecha"}
            className="text-2xs rounded-full border border-cream-400 px-2 py-0.5 font-semibold text-brown-500 transition-colors hover:border-brown-600 hover:text-brown-800"
          >
            {isDone ? "Reabrir ↺" : "Marcar como hecha ✓"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(goal.id);
            }}
            className="text-brown-300 cursor-pointer text-sm transition-colors hover:text-red-500"
            aria-label="Eliminar"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

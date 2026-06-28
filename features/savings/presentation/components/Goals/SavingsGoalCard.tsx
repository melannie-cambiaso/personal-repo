"use client";

import type { GoalWithProgress } from "@/features/savings/domain";
import { ProgressBar } from "@/shared/components/ProgressBar/ProgressBar";

interface Props {
  goal: GoalWithProgress;
  isOwner: boolean;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (id: string) => void;
  dragHandleProps: React.HTMLAttributes<HTMLElement>;
}

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export function SavingsGoalCard({ goal, isOwner, onEdit, onDelete, dragHandleProps }: Props) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-cream-300 bg-white px-5 py-4 shadow-sm transition-all ${isOwner ? "cursor-pointer hover:border-brown-300 hover:shadow-card-hover" : ""}`}
      onClick={() => isOwner && onEdit(goal)}
    >
      {isOwner && (
        <button
          type="button"
          {...(dragHandleProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          className="mt-1 cursor-grab touch-none text-lg text-brown-300 transition-colors hover:text-brown-500 active:cursor-grabbing"
          aria-label="Reordenar"
          onClick={(e) => e.stopPropagation()}
        >
          ☰
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-brown-900">{goal.name}</span>
          {goal.isCompleted && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-2xs font-semibold text-green-700">
              Completada ✓
            </span>
          )}
        </div>
        <ProgressBar value={goal.progress} />
        <span className="text-xs text-brown-400">
          {fmt(goal.currentAmount)} / {fmt(goal.targetAmount)}
        </span>
      </div>
      {isOwner && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
          className="cursor-pointer text-sm text-brown-300 transition-colors hover:text-red-500"
          aria-label="Eliminar"
        >
          ✕
        </button>
      )}
    </div>
  );
}

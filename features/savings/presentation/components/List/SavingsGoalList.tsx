"use client";

import type { GoalWithProgress } from "@/features/savings/domain";
import { SavingsGoalCard } from "./SavingsGoalCard";

interface Props {
  goals: GoalWithProgress[];
  isOwner: boolean;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onToggleDone: (id: string) => void;
}

export function SavingsGoalList({
  goals,
  isOwner,
  onEdit,
  onDelete,
  onReorder,
  onToggleDone,
}: Props) {
  if (goals.length === 0) {
    return (
      <div className="text-brown-400 py-16 text-center">
        <p className="mb-1 text-4xl">🎯</p>
        <p className="text-sm">Todavía no hay metas. ¡Agregá la primera!</p>
      </div>
    );
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= goals.length) return;
    const ids = goals.map((g) => g.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onReorder(ids);
  };

  return (
    <div className="flex flex-col gap-3">
      {goals.map((goal, index) => (
        <SavingsGoalCard
          key={goal.id}
          goal={goal}
          isOwner={isOwner}
          isFirst={index === 0}
          isLast={index === goals.length - 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onMoveUp={() => move(index, -1)}
          onMoveDown={() => move(index, 1)}
          onToggleDone={onToggleDone}
        />
      ))}
    </div>
  );
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  priority: number;
  createdAt: string;
}

export interface GoalWithProgress extends SavingsGoal {
  currentAmount: number;
  progress: number;
  isCompleted: boolean;
}

export function sortGoalsByPriority(goals: SavingsGoal[]): SavingsGoal[] {
  return [...goals].sort((a, b) =>
    a.priority !== b.priority
      ? a.priority - b.priority
      : a.createdAt.localeCompare(b.createdAt),
  );
}

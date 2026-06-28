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

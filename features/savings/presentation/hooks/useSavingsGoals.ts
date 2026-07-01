"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SavingsGoal } from "@/features/savings/domain";
import { distributeToGoals, normalizePriorities } from "@/features/savings/domain";

interface Params {
  initialGoals: SavingsGoal[];
  balance: number;
  onSave: (goals: SavingsGoal[]) => Promise<void> | void;
}

export function useSavingsGoals({ initialGoals, balance, onSave }: Params) {
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals);
  const goalsRef = useRef(initialGoals);

  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  const { goals: distributed, surplus } = useMemo(
    () => distributeToGoals(balance, goals),
    [balance, goals]
  );

  const persist = (next: SavingsGoal[]) => {
    goalsRef.current = next;
    setGoals(next);
    void onSave(next);
  };

  const handleAdd = ({ name, targetAmount }: { name: string; targetAmount: number }) => {
    if (targetAmount <= 0) return;
    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      name,
      targetAmount,
      priority: goalsRef.current.length + 1,
      createdAt: new Date().toISOString(),
      isDone: false,
    };
    persist(normalizePriorities([...goalsRef.current, newGoal]));
  };

  const handleEdit = (
    id: string,
    { name, targetAmount }: { name: string; targetAmount: number }
  ) => {
    if (targetAmount <= 0) return;
    const next = goalsRef.current.map((g) => (g.id === id ? { ...g, name, targetAmount } : g));
    persist(normalizePriorities(next));
  };

  const handleDelete = (id: string) => {
    persist(normalizePriorities(goalsRef.current.filter((g) => g.id !== id)));
  };

  const handleReorder = (orderedIds: string[]) => {
    const map = new Map(goalsRef.current.map((g) => [g.id, g]));
    // Pre-assign sequential priorities matching the new order so normalizePriorities preserves it
    const reordered = orderedIds.flatMap((id, i) => {
      const goal = map.get(id);
      return goal ? [{ ...goal, priority: i + 1 }] : [];
    });
    persist(normalizePriorities(reordered));
  };

  const handleToggleDone = (id: string) => {
    const next = goalsRef.current.map((g) => (g.id === id ? { ...g, isDone: !g.isDone } : g));
    persist(normalizePriorities(next));
  };

  return {
    distributed,
    surplus,
    handleAdd,
    handleEdit,
    handleDelete,
    handleReorder,
    handleToggleDone,
  };
}

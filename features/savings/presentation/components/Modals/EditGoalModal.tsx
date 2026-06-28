"use client";

import { useEffect, useState } from "react";
import type { SavingsGoal } from "@/features/savings/domain";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button } from "@/shared/components";
import { GoalFormFields, validateGoalForm } from "./GoalFormFields";

interface Props {
  goal: SavingsGoal | null;
  onClose: () => void;
  onSave: (id: string, data: { name: string; targetAmount: number }) => void;
}

export function EditGoalModal({ goal, onClose, onSave }: Props) {
  const isOpen = goal !== null;

  const [form, setForm] = useState({ name: "", targetAmount: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && goal) {
      setForm({ name: goal.name, targetAmount: String(goal.targetAmount) });
      setError(null);
    }
  }, [isOpen, goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
    const err = validateGoalForm(form);
    if (err) {
      setError(err);
      return;
    }
    onSave(goal.id, { name: form.name.trim(), targetAmount: Number(form.targetAmount) });
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Editar meta">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <GoalFormFields form={form} error={error} setForm={setForm} />
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Guardar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button } from "@/shared/components";
import { GoalFormFields, validateGoalForm } from "./GoalFormFields";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; targetAmount: number }) => void;
}

const EMPTY = { name: "", targetAmount: "" };

export function AddGoalModal({ isOpen, onClose, onAdd }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateGoalForm(form);
    if (err) { setError(err); return; }
    onAdd({ name: form.name.trim(), targetAmount: Number(form.targetAmount) });
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Nueva meta">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <GoalFormFields
          form={form}
          error={error}
          setForm={setForm}
          namePlaceholder="Ej: Fondo de emergencia"
          amountPlaceholder="0"
        />
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Agregar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

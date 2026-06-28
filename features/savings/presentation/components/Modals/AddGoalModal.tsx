"use client";

import { useEffect, useState } from "react";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button } from "@/shared/components";
import { GoalFormFields } from "./GoalFormFields";

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
    const trimmedName = form.name.trim();
    const amount = Number(form.targetAmount);
    if (!trimmedName) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (amount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }
    onAdd({ name: trimmedName, targetAmount: amount });
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

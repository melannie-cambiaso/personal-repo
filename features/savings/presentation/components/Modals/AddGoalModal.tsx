"use client";

import { useEffect, useState } from "react";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field, Input } from "@/shared/components";

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
        <Field label="Nombre *">
          <Input
            type="text"
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
            placeholder="Ej: Fondo de emergencia"
          />
        </Field>
        <Field label="Monto objetivo * ($)">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={form.targetAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
            required
            placeholder="0"
          />
        </Field>
        {error && <p className="text-xs text-red-600">{error}</p>}
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

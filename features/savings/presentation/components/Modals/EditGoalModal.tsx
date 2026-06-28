"use client";

import { useEffect, useState } from "react";
import type { SavingsGoal } from "@/features/savings/domain";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";

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
    onSave(goal.id, { name: trimmedName, targetAmount: amount });
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-dancing text-2xl font-bold text-brown-900">Editar meta</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-xl text-brown-400 transition-colors hover:text-brown-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nombre *">
            <input
              className={input}
              type="text"
              maxLength={60}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Monto objetivo * ($)">
            <input
              className={input}
              type="number"
              min="0.01"
              step="0.01"
              value={form.targetAmount}
              onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
              required
            />
          </Field>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancelar
            </button>
            <button type="submit" className={btnPrimary}>
              Guardar ✓
            </button>
          </div>
        </form>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs font-semibold uppercase tracking-store text-brown-400">{label}</span>
      {children}
    </label>
  );
}

const input =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";
const btnSecondary =
  "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnPrimary =
  "cursor-pointer rounded-lg bg-brown-800 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700";

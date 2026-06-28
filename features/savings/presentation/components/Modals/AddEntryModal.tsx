"use client";

import { useEffect, useState } from "react";
import type { SavingsEntry, EntryType } from "@/features/savings/domain/SavingsEntry";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button } from "@/shared/components";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: SavingsEntry) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = {
  type: "deposito" as EntryType,
  amount: "",
  date: today(),
  notes: "",
  toReplenish: false,
};

export function AddEntryModal({ isOpen, onClose, onAdd }: Props) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY, date: today() });
    }
  }, [isOpen]);

  const setField =
    (field: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value =
        field === "toReplenish" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({
        ...prev,
        [field]: value,
        ...(field === "type" && value === "deposito" ? { toReplenish: false } : {}),
      }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: SavingsEntry = {
      id: crypto.randomUUID(),
      type: form.type,
      amount: Number(form.amount),
      date: form.date,
      notes: form.notes.trim() || undefined,
      toReplenish: form.type === "deposito" ? false : form.toReplenish,
      createdAt: new Date().toISOString(),
    };
    onAdd(entry);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-dancing text-brown-900 text-2xl font-bold">Nuevo registro</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-brown-400 hover:text-brown-800 cursor-pointer text-xl transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Tipo *">
          <select className={input} value={form.type} onChange={setField("type")}>
            <option value="deposito">Depósito</option>
            <option value="gasto">Gasto</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monto * ($)">
            <input
              className={input}
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={setField("amount")}
              required
              placeholder="0"
            />
          </Field>
          <Field label="Fecha *">
            <input
              className={input}
              type="date"
              value={form.date}
              onChange={setField("date")}
              required
            />
          </Field>
        </div>
        <Field label="Notas">
          <textarea
            className={`${input} resize-none`}
            rows={2}
            value={form.notes}
            onChange={setField("notes")}
          />
        </Field>
        {form.type === "gasto" && (
          <label className="text-brown-700 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.toReplenish}
              onChange={setField("toReplenish")}
              className="accent-brown-700 h-4 w-4"
            />
            A reponer este mes
          </label>
        )}
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} className="secondary">
            Cancelar
          </Button>
          <Button type="submit" className="primary">
            Agregar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

const input =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";

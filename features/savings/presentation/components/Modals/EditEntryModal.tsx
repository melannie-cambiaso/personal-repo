"use client";

import { useEffect, useState } from "react";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field } from "@/shared/components";

interface Props {
  entry: SavingsEntry | null;
  onClose: () => void;
  onSave: (entry: SavingsEntry) => void;
}

export function EditEntryModal({ entry, onClose, onSave }: Props) {
  const isOpen = entry !== null;

  const [form, setForm] = useState({
    amount: "",
    date: "",
    notes: "",
    toReplenish: false,
  });

  useEffect(() => {
    if (isOpen && entry) {
      setForm({
        amount: String(entry.amount),
        date: entry.date,
        notes: entry.notes ?? "",
        toReplenish: entry.toReplenish,
      });
    }
  }, [isOpen, entry]);

  const setField =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "toReplenish" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    onSave({
      ...entry,
      amount: Number(form.amount),
      date: form.date,
      notes: form.notes.trim() || undefined,
      toReplenish: entry.type === "deposito" ? false : form.toReplenish,
    });
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-dancing text-brown-900 text-2xl font-bold">Editar registro</h2>
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
        {entry?.type === "gasto" && (
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
            Guardar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

const input =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";

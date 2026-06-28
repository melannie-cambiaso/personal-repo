"use client";

import { useEffect, useState } from "react";
import type { SavingsEntry, EntryType } from "@/features/savings/domain/SavingsEntry";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: SavingsEntry) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { type: "deposito" as EntryType, amount: "", date: today(), notes: "", toReplenish: false };

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
      const value = field === "toReplenish" ? (e.target as HTMLInputElement).checked : e.target.value;
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
          <h2 className="font-dancing text-2xl font-bold text-brown-900">Nuevo registro</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-xl text-brown-400 transition-colors hover:text-brown-800" aria-label="Cerrar">✕</button>
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
              <input className={input} type="number" min="0.01" step="0.01" value={form.amount} onChange={setField("amount")} required placeholder="0" />
            </Field>
            <Field label="Fecha *">
              <input className={input} type="date" value={form.date} onChange={setField("date")} required />
            </Field>
          </div>
          <Field label="Notas">
            <textarea className={`${input} resize-none`} rows={2} value={form.notes} onChange={setField("notes")} />
          </Field>
          {form.type === "gasto" && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-brown-700">
              <input type="checkbox" checked={form.toReplenish} onChange={setField("toReplenish")} className="h-4 w-4 accent-brown-700" />
              A reponer este mes
            </label>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
            <button type="submit" className={btnPrimary}>Agregar ✓</button>
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

const input = "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";
const btnSecondary = "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnPrimary = "cursor-pointer rounded-lg bg-brown-800 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700";

"use client";

import { useEffect, useRef, useState } from "react";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";

interface Props {
  entry: SavingsEntry | null;
  onClose: () => void;
  onSave: (entry: SavingsEntry) => void;
}

export function EditEntryModal({ entry, onClose, onSave }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = entry !== null;

  const [form, setForm] = useState({
    amount: "",
    date: "",
    notes: "",
    toReplenish: false,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && entry) {
      setForm({
        amount: String(entry.amount),
        date: entry.date,
        notes: entry.notes ?? "",
        toReplenish: entry.toReplenish,
      });
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen, entry]);

  const setField =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = field === "toReplenish" ? (e.target as HTMLInputElement).checked : e.target.value;
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
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-md rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
    >
      <div className="px-6 py-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-dancing text-2xl font-bold text-brown-900">Editar registro</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-xl text-brown-400 transition-colors hover:text-brown-800" aria-label="Cerrar">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monto * ($)">
              <input className={input} type="number" min="0.01" step="0.01" value={form.amount} onChange={setField("amount")} required />
            </Field>
            <Field label="Fecha *">
              <input className={input} type="date" value={form.date} onChange={setField("date")} required />
            </Field>
          </div>
          <Field label="Notas">
            <textarea className={`${input} resize-none`} rows={2} value={form.notes} onChange={setField("notes")} />
          </Field>
          {entry?.type === "gasto" && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-brown-700">
              <input type="checkbox" checked={form.toReplenish} onChange={setField("toReplenish")} className="h-4 w-4 accent-brown-700" />
              A reponer este mes
            </label>
          )}
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
            <button type="submit" className={btnPrimary}>Guardar ✓</button>
          </div>
        </form>
      </div>
    </dialog>
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

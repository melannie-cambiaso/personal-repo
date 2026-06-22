"use client";

import { useEffect, useRef, useState } from "react";
import type { FinanceEntry } from "@/features/finance/domain/FinanceEntry";
import { GROUPS, getGroupForCategory } from "@/features/finance/domain";

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { type: "expense" as FinanceEntry["type"], group: "", category: "", amount: "", date: today(), description: "" };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: FinanceEntry) => void;
}

export function AddEntryModal({ isOpen, onClose, onAdd }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) { setForm({ ...EMPTY, date: today() }); dialog.showModal(); }
    else dialog.close();
  }, [isOpen]);

  const availableGroups = GROUPS.filter((g) => g.type === form.type);
  const selectedGroup = GROUPS.find((g) => g.name === form.group);

  const handleTypeChange = (type: FinanceEntry["type"]) => {
    setForm((f) => ({ ...f, type, group: "", category: "" }));
  };
  const handleGroupChange = (group: string) => {
    setForm((f) => ({ ...f, group, category: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: FinanceEntry = {
      id: crypto.randomUUID(),
      type: form.type,
      group: getGroupForCategory(form.category),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      description: form.description.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    onAdd(entry);
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
          <h2 className="font-dancing text-2xl font-bold text-brown-900">Nuevo registro</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-xl text-brown-400 transition-colors hover:text-brown-800" aria-label="Cerrar">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Tipo *">
            <select className={input} value={form.type} onChange={(e) => handleTypeChange(e.target.value as FinanceEntry["type"])} required>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </Field>
          <Field label="Grupo *">
            <select className={input} value={form.group} onChange={(e) => handleGroupChange(e.target.value)} required>
              <option value="" disabled>Seleccionar grupo...</option>
              {availableGroups.map((g) => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categoría *">
            <select className={input} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required disabled={!selectedGroup}>
              <option value="" disabled>Seleccionar categoría...</option>
              {selectedGroup?.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monto * ($)">
              <input className={input} type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required placeholder="0" />
            </Field>
            <Field label="Fecha *">
              <input className={input} type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </Field>
          </div>
          <Field label="Descripción">
            <textarea className={`${input} resize-none`} rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
            <button type="submit" className={btnPrimary}>Agregar ✓</button>
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

const input = "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600 disabled:opacity-50";
const btnSecondary = "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnPrimary = "cursor-pointer rounded-lg bg-brown-800 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700";

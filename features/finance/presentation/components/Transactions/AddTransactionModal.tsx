"use client";

import { useEffect, useRef, useState } from "react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory: string;
  allCategories: string[];
  onAdd: (category: string, amount: number, note?: string) => Promise<void>;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  initialCategory,
  allCategories,
  onAdd,
}: AddTransactionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      setSelectedCategory(initialCategory);
      setAmount("");
      setNote("");
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen, initialCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    setSubmitting(true);
    try {
      await onAdd(selectedCategory, parsed, note || undefined);
      setAmount("");
      setNote("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-md rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="px-6 py-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-dancing text-2xl font-bold text-brown-900">Registrar gasto</h2>
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
          <Field label="Categoría">
            <select
              className={input}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Monto * ($)">
            <input
              className={input}
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
            />
          </Field>

          <Field label="Nota (opcional)">
            <input
              className={input}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ej: super del martes"
              maxLength={120}
            />
          </Field>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? "Guardando..." : "Agregar ✓"}
            </button>
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

const input =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";
const btnSecondary =
  "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnPrimary =
  "cursor-pointer rounded-lg bg-brown-800 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700 disabled:opacity-50";

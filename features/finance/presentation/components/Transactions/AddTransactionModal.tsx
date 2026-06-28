"use client";

import { useEffect, useState } from "react";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field } from "@/shared/components";

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
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(initialCategory);
      setAmount("");
      setNote("");
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
    <ModalShell isOpen={isOpen} onCancel={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-dancing text-brown-900 text-2xl font-bold">Registrar gasto</h2>
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
          <Button onPress={onClose} type="button" className="secondary">
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="primary">
            {submitting ? "Guardando..." : "Agregar ✓"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

const input =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";

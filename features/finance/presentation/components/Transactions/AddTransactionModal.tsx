"use client";

import { useEffect, useState } from "react";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field, Input, Select } from "@/shared/components";

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
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Registrar gasto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Categoría">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Monto * ($)">
          <Input
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
          <Input
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

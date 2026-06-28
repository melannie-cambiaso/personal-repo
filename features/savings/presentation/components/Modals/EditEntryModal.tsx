"use client";

import { useEffect, useState } from "react";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button } from "@/shared/components";
import { EntryFormFields } from "./EntryFormFields";

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
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Editar registro">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <EntryFormFields
          form={form}
          showReplenish={entry?.type === "gasto"}
          setField={setField}
        />
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Guardar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

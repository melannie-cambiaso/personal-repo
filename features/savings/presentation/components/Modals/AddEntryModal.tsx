"use client";

import { useState } from "react";
import type { SavingsEntry, EntryType } from "@/features/savings/domain/SavingsEntry";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Select, Field } from "@/shared/components";
import { EntryFormFields } from "./EntryFormFields";

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
  const [form, setForm] = useState(() => ({ ...EMPTY, date: today() }));

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
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Nuevo registro">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Tipo *">
          <Select value={form.type} onChange={setField("type")}>
            <option value="deposito">Depósito</option>
            <option value="gasto">Gasto</option>
          </Select>
        </Field>
        <EntryFormFields
          form={form}
          showReplenish={form.type === "gasto"}
          setField={setField}
          amountPlaceholder="0"
        />
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Agregar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

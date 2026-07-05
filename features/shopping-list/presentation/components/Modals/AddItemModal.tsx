"use client";

import { useState } from "react";
import type { ShoppingCategory } from "@/features/shopping-list/domain";
import { ModalShell, Button } from "@/shared/components";
import { ItemFormFields, validateItemForm } from "./ItemFormFields";

interface Props {
  isOpen: boolean;
  categories: ShoppingCategory[];
  onClose: () => void;
  onAdd: (data: { name: string; categoryId: string }) => void;
}

const EMPTY = { name: "", categoryId: "" };

export function AddItemModal({ isOpen, categories, onClose, onAdd }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateItemForm(form);
    if (err) {
      setError(err);
      return;
    }
    onAdd({ name: form.name.trim(), categoryId: form.categoryId });
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Nuevo producto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ItemFormFields
          form={form}
          error={error}
          setForm={setForm}
          categories={categories}
          namePlaceholder="Ej: Detergente"
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

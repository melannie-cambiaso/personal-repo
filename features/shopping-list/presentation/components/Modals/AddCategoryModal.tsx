"use client";

import { useState } from "react";
import { ModalShell, Button } from "@/shared/components";
import { CategoryFormFields, validateCategoryForm } from "./CategoryFormFields";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

const EMPTY = { name: "" };

export function AddCategoryModal({ isOpen, onClose, onAdd }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateCategoryForm(form);
    if (err) {
      setError(err);
      return;
    }
    onAdd(form.name.trim());
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Nueva categoría">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CategoryFormFields
          form={form}
          error={error}
          setForm={setForm}
          placeholder="Ej: Limpieza"
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

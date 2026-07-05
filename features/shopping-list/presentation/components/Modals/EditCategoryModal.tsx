"use client";

import { useState } from "react";
import type { ShoppingCategory } from "@/features/shopping-list/domain";
import { ModalShell, Button } from "@/shared/components";
import { CategoryFormFields, validateCategoryForm } from "./CategoryFormFields";

interface Props {
  category: ShoppingCategory | null;
  onClose: () => void;
  onSave: (id: string, name: string) => void;
}

export function EditCategoryModal({ category, onClose, onSave }: Props) {
  const isOpen = category !== null;

  const [form, setForm] = useState({ name: category?.name ?? "" });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    const err = validateCategoryForm(form);
    if (err) {
      setError(err);
      return;
    }
    onSave(category.id, form.name.trim());
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Editar categoría">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CategoryFormFields form={form} error={error} setForm={setForm} />
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

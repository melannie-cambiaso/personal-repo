"use client";

import { useState } from "react";
import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";
import { ModalShell, Button } from "@/shared/components";
import { ItemFormFields, validateItemForm } from "./ItemFormFields";

interface Props {
  item: ShoppingItem | null;
  categories: ShoppingCategory[];
  onClose: () => void;
  onSave: (id: string, data: { name: string; categoryId: string }) => void;
}

export function EditItemModal({ item, categories, onClose, onSave }: Props) {
  const isOpen = item !== null;

  const [form, setForm] = useState({
    name: item?.name ?? "",
    categoryId: item?.categoryId ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    const err = validateItemForm(form);
    if (err) {
      setError(err);
      return;
    }
    onSave(item.id, { name: form.name.trim(), categoryId: form.categoryId });
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Editar producto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ItemFormFields form={form} error={error} setForm={setForm} categories={categories} />
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

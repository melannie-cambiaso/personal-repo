"use client";

import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";
import { canDeleteCategory } from "@/features/shopping-list/domain";
import { ModalShell, Button } from "@/shared/components";

interface Props {
  category: ShoppingCategory | null;
  items: ShoppingItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteCategoryConfirmModal({ category, items, onConfirm, onCancel }: Props) {
  const isOpen = category !== null;
  const canDelete = category ? canDeleteCategory(category.id, items) : true;

  return (
    <ModalShell isOpen={isOpen} onCancel={onCancel} maxWidth="sm" disableBackdropClose>
      <h2 className="font-dancing text-brown-900 mb-3 text-2xl font-bold">¿Eliminar categoría?</h2>
      {category && canDelete && (
        <p className="text-brown-600 mb-5 text-sm leading-relaxed">
          Vas a eliminar <strong>{category.name}</strong>. Esta acción no se puede deshacer.
        </p>
      )}
      {category && !canDelete && (
        <p className="mb-5 text-sm leading-relaxed text-red-600">
          No podés eliminar <strong>{category.name}</strong> porque todavía tiene productos.
          Quitá o movés los productos primero.
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button type="button" onPress={onCancel} variant="secondary">
          Cancelar
        </Button>
        {canDelete && (
          <Button type="button" onPress={onConfirm} variant="danger">
            Eliminar
          </Button>
        )}
      </div>
    </ModalShell>
  );
}

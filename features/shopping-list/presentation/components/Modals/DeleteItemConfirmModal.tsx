"use client";

import type { ShoppingItem } from "@/features/shopping-list/domain";
import { ModalShell, Button } from "@/shared/components";

interface Props {
  item: ShoppingItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteItemConfirmModal({ item, onConfirm, onCancel }: Props) {
  const isOpen = item !== null;

  return (
    <ModalShell isOpen={isOpen} onCancel={onCancel} maxWidth="sm" disableBackdropClose>
      <h2 className="font-dancing text-brown-900 mb-3 text-2xl font-bold">¿Eliminar producto?</h2>
      <p className="text-brown-600 mb-5 text-sm leading-relaxed">
        {item && (
          <>
            Vas a eliminar <strong>{item.name}</strong>. Esta acción no se puede deshacer.
          </>
        )}
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" onPress={onCancel} variant="secondary">
          Cancelar
        </Button>
        <Button type="button" onPress={onConfirm} variant="danger">
          Eliminar
        </Button>
      </div>
    </ModalShell>
  );
}

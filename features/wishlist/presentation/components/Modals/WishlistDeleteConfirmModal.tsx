"use client";

import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";
import { Button } from "@/shared/components";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";

interface Props {
  item: WishlistItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WishlistDeleteConfirmModal({ item, onConfirm, onCancel }: Props) {
  const isOpen = item !== null;

  return (
    <ModalShell isOpen={isOpen} onCancel={onCancel} maxWidth="sm" disableBackdropClose>
      {item && (
        <>
          <h2 className="font-dancing text-brown-900 mb-3 text-2xl font-bold">¿Eliminar item?</h2>
          <p className="text-brown-600 mb-5 text-sm leading-relaxed">
            ¿Seguro que querés eliminar <strong>{item.title}</strong>? Esta acción no se puede
            deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" onPress={onCancel} className="secondary">
              Cancelar
            </Button>

            <button type="button" onClick={onConfirm} className={btnDanger}>
              Eliminar
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
const btnDanger =
  "cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-red-700";

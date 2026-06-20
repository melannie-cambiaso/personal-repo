"use client";

import { useEffect, useRef } from "react";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";

interface Props {
  item: WishlistItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WishlistDeleteConfirmModal({ item, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = item !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    isOpen ? dialog.showModal() : dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-sm rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
    >
      {item && (
        <div className="px-6 py-5">
          <h2 className="font-dancing mb-3 text-2xl font-bold text-brown-900">¿Eliminar item?</h2>
          <p className="mb-5 text-sm leading-relaxed text-brown-600">
            ¿Seguro que querés eliminar <strong>{item.title}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className={btnSecondary}>Cancelar</button>
            <button type="button" onClick={onConfirm} className={btnDanger}>Eliminar</button>
          </div>
        </div>
      )}
    </dialog>
  );
}

const btnSecondary = "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnDanger = "cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-red-700";

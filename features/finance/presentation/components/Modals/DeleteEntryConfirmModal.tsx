"use client";

import { useEffect, useRef } from "react";
import type { FinanceEntry } from "@/features/finance/domain/FinanceEntry";

interface Props {
  entry: FinanceEntry | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteEntryConfirmModal({ entry, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (entry) dialog.showModal();
    else dialog.close();
  }, [entry]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-sm rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      onClick={(e) => { if (e.target === dialogRef.current) onCancel(); }}
    >
      <div className="px-6 py-5">
        <h2 className="font-dancing mb-2 text-2xl font-bold text-brown-900">¿Eliminar registro?</h2>
        <p className="mb-6 text-sm text-brown-500">
          Esta acción no se puede deshacer.
          {entry && <> Se eliminará <strong className="text-brown-700">{entry.category}</strong> por <strong className="text-brown-700">${entry.amount.toLocaleString("es-AR")}</strong>.</>}
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className={btnSecondary}>Cancelar</button>
          <button type="button" onClick={onConfirm} className={btnDanger}>Eliminar</button>
        </div>
      </div>
    </dialog>
  );
}

const btnSecondary = "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnDanger = "cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-red-600";

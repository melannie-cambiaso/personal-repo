"use client";

import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";

interface Props {
  entry: SavingsEntry | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteEntryConfirmModal({ entry, onConfirm, onCancel }: Props) {
  const isOpen = entry !== null;

  return (
    <ModalShell isOpen={isOpen} onCancel={onCancel} maxWidth="sm" disableBackdropClose>
      <h2 className="font-dancing mb-3 text-2xl font-bold text-brown-900">¿Eliminar registro?</h2>
      <p className="mb-5 text-sm leading-relaxed text-brown-600">
        {entry && (
          <>
            {entry.type === "deposito" ? "Depósito" : "Gasto"} de{" "}
            <strong>{formatCLP(entry.amount)}</strong> del{" "}
            <strong>{entry.date}</strong>. Esta acción no se puede deshacer.
          </>
        )}
      </p>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancelar</button>
        <button type="button" onClick={onConfirm} className={btnDanger}>Eliminar</button>
      </div>
    </ModalShell>
  );
}

const btnSecondary = "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnDanger = "cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-red-700";

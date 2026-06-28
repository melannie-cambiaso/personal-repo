"use client";

import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button } from "@/shared/components";

interface Props {
  entry: SavingsEntry | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteEntryConfirmModal({ entry, onConfirm, onCancel }: Props) {
  const isOpen = entry !== null;

  return (
    <ModalShell isOpen={isOpen} onCancel={onCancel} maxWidth="sm" disableBackdropClose>
      <h2 className="font-dancing text-brown-900 mb-3 text-2xl font-bold">¿Eliminar registro?</h2>
      <p className="text-brown-600 mb-5 text-sm leading-relaxed">
        {entry && (
          <>
            {entry.type === "deposito" ? "Depósito" : "Gasto"} de{" "}
            <strong>{formatCLP(entry.amount)}</strong> del <strong>{entry.date}</strong>. Esta
            acción no se puede deshacer.
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

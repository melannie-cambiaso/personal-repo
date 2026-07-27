"use client";

import { useState } from "react";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import { computeTotalToReplenish } from "@/features/savings/domain/computeTotalToReplenish";
import { formatCLP } from "@/shared/utils/formatCurrency";
import { ModalShell, Field, Input, Button } from "@/shared/components";

interface Props {
  isOpen: boolean;
  entries: SavingsEntry[];
  onClose: () => void;
  onConfirm: (data: { initialAmount?: number; label?: string }) => void;
}

export function ArchivePeriodModal({ isOpen, entries, onClose, onConfirm }: Props) {
  const [initialAmount, setInitialAmount] = useState("");
  const [label, setLabel] = useState("");

  const pendingEntries = entries.filter((e) => e.type === "gasto" && e.toReplenish);
  const pendingTotal = computeTotalToReplenish(entries);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      initialAmount: initialAmount.trim() ? Number(initialAmount) : undefined,
      label: label.trim() ? label.trim() : undefined,
    });
    setInitialAmount("");
    setLabel("");
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Archivar período" disableBackdropClose>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-brown-600 text-sm leading-relaxed">
          El período actual se cerrará como archivo de solo lectura y se abrirá uno nuevo. Esta
          acción no se puede deshacer.
        </p>
        {pendingEntries.length > 0 && (
          <p className="text-2xs rounded-lg bg-amber-100 px-3 py-2 font-semibold text-amber-800">
            Hay {pendingEntries.length} gasto{pendingEntries.length === 1 ? "" : "s"} pendiente
            {pendingEntries.length === 1 ? "" : "s"} de reponer por {formatCLP(pendingTotal)}. Se
            archivarán junto con el período, sin moverse al nuevo.
          </p>
        )}
        <Field label="Monto inicial (opcional, $)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Nombre del nuevo período (opcional)">
          <Input
            type="text"
            maxLength={60}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej: Abril 2026"
          />
        </Field>
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="danger">
            Archivar y empezar de nuevo
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

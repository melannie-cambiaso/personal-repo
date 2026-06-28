"use client";

import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell, Button } from "@/shared/components";

interface Props {
  zone: Zone | null;
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteZoneConfirmModal({ zone, itemCount, onConfirm, onCancel }: Props) {
  const isOpen = zone !== null;

  return (
    <ModalShell isOpen={isOpen} onCancel={onCancel} maxWidth="sm" disableBackdropClose>
      <h2 className="font-dancing text-brown-900 mb-3 text-2xl font-bold">¿Eliminar zona?</h2>
      <p className="text-brown-600 mb-5 text-sm leading-relaxed">
        La zona{" "}
        <strong>
          {zone?.emoji ? `${zone.emoji} ` : ""}
          {zone?.name}
        </strong>{" "}
        tiene{" "}
        <strong>
          {itemCount} {itemCount === 1 ? "mejora" : "mejoras"}
        </strong>
        . Si la eliminás, se borrarán también. Esta acción no se puede deshacer.
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" onPress={onCancel} variant="secondary">
          Cancelar
        </Button>
        <Button type="button" onPress={onConfirm} variant="danger">
          Eliminar todo
        </Button>
      </div>
    </ModalShell>
  );
}

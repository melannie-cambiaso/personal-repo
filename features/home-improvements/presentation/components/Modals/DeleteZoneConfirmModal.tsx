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
      <h2 className="text-brown-900 mb-4 text-3xl font-semibold tracking-tight">
        ¿Eliminar zona?
      </h2>
      <p className="text-brown-600 mb-5 leading-relaxed">
        La zona{" "}
        <strong className="text-brown-900 font-normal">
          {zone?.emoji ? `${zone.emoji} ` : ""}
          {zone?.name}
        </strong>{" "}
        tiene{" "}
        <strong className="text-brown-900 font-normal">
          <span className="font-figure">{itemCount}</span> {itemCount === 1 ? "mejora" : "mejoras"}
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

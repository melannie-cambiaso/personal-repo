"use client";

import type { SavingsGoal } from "@/features/savings/domain";
import { Button } from "@/shared/components";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";

interface Props {
  goal: SavingsGoal | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteGoalConfirmModal({ goal, onConfirm, onCancel }: Props) {
  const isOpen = goal !== null;

  return (
    <ModalShell isOpen={isOpen} onCancel={onCancel} maxWidth="sm" disableBackdropClose>
      <h2 className="font-dancing text-brown-900 mb-3 text-2xl font-bold">¿Eliminar meta?</h2>
      <p className="text-brown-600 mb-5 text-sm leading-relaxed">
        {goal && (
          <>
            Vas a eliminar <strong>{goal.name}</strong>. Esta acción no se puede deshacer.
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

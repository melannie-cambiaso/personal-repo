"use client";

import { useState } from "react";
import type { SavingsFundConfig } from "@/features/finance-v2/domain";
import type { SavingsFundConfigInput } from "../../../hooks/useFinanceV2SavingsFund";
import { Button, Field, Input, ModalShell } from "@/shared/components";

interface Props {
  isOpen: boolean;
  /** `null` = creating the fund; otherwise editing it in place. */
  config: SavingsFundConfig | null;
  onClose: () => void;
  onSave: (input: SavingsFundConfigInput) => void;
}

// The form is rendered only while open so it remounts (and reseeds from `config`) on
// every opening — the `<dialog>` itself never unmounts (see `EnvelopeConfigModal`).
// `openingMonth` is deliberately NOT a field: the hook sets it to the viewed month on
// creation and preserves it afterwards. Unlike the envelope there is no category picker:
// the fund is not bound to any budget category.
export function SavingsFundConfigModal({ isOpen, config, onClose, onSave }: Props) {
  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Ahorros">
      {isOpen && (
        <SavingsFundConfigForm
          config={config}
          onSave={(input) => {
            onSave(input);
            onClose();
          }}
        />
      )}
    </ModalShell>
  );
}

function SavingsFundConfigForm({ config, onSave }: Pick<Props, "config" | "onSave">) {
  const [name, setName] = useState(config?.name ?? "");
  const [openingBalance, setOpeningBalance] = useState(config ? String(config.openingBalance) : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const parsedBalance = openingBalance === "" ? 0 : Number(openingBalance);
    if (!trimmed || !Number.isFinite(parsedBalance)) return;

    onSave({ name: trimmed, openingBalance: parsedBalance });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="Nombre del fondo">
        <Input
          value={name}
          placeholder="Ahorros"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="Saldo inicial">
        <Input
          type="number"
          value={openingBalance}
          placeholder="0"
          autoComplete="off"
          onChange={(e) => setOpeningBalance(e.target.value)}
        />
      </Field>

      <Button type="submit" variant="primary">
        Guardar ahorros
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import type { BudgetCategory, EnvelopeConfig } from "@/features/finance-v2/domain";
import type { EnvelopeConfigInput } from "../../../hooks/useFinanceV2Envelope";
import { Button, Field, Input, ModalShell, Select } from "@/shared/components";

interface Props {
  isOpen: boolean;
  /** `null` = creating the envelope; otherwise editing it in place. */
  config: EnvelopeConfig | null;
  /** TOP-LEVEL budget categories only — the envelope binds to a parent (e.g. "Cuentas")
   *  or a childless category, never to a subcategory. */
  categories: BudgetCategory[];
  onClose: () => void;
  onSave: (input: EnvelopeConfigInput) => void;
}

// The form is rendered only while open so it remounts (and reseeds from `config`) on
// every opening — the `<dialog>` itself never unmounts (see `AddTransactionModal`).
// `openingMonth` is deliberately NOT a field: the hook sets it to the viewed month on
// creation and preserves it afterwards (spec: set once, never changed).
export function EnvelopeConfigModal({ isOpen, config, categories, onClose, onSave }: Props) {
  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Cuenta separada">
      {isOpen && (
        <EnvelopeConfigForm
          config={config}
          categories={categories}
          onSave={(input) => {
            onSave(input);
            onClose();
          }}
        />
      )}
    </ModalShell>
  );
}

function EnvelopeConfigForm({
  config,
  categories,
  onSave,
}: Pick<Props, "config" | "categories" | "onSave">) {
  const [name, setName] = useState(config?.name ?? "");
  const [boundCategoryId, setBoundCategoryId] = useState(
    config?.boundCategoryId ?? categories[0]?.id ?? ""
  );
  const [openingBalance, setOpeningBalance] = useState(config ? String(config.openingBalance) : "");

  const hasCategories = categories.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const parsedBalance = openingBalance === "" ? 0 : Number(openingBalance);
    if (!trimmed || !boundCategoryId || !Number.isFinite(parsedBalance)) return;

    onSave({ name: trimmed, boundCategoryId, openingBalance: parsedBalance });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="Nombre de la cuenta">
        <Input
          value={name}
          placeholder="Servicios"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      {hasCategories ? (
        <Field label="Categoría vinculada">
          <Select
            value={boundCategoryId}
            onChange={(e) => setBoundCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
      ) : (
        <p className="text-brown-500 text-sm">
          Primero creá una categoría en Presupuesto para vincularla a esta cuenta.
        </p>
      )}

      <Field label="Saldo inicial">
        <Input
          type="number"
          value={openingBalance}
          placeholder="0"
          autoComplete="off"
          onChange={(e) => setOpeningBalance(e.target.value)}
        />
      </Field>

      <Button type="submit" variant="primary" disabled={!hasCategories}>
        Guardar cuenta
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "@/shared/hooks/useForm";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell, Field, Input, Select } from "@/shared/components";
import { ItemFormFields } from "./ItemFormFields";

interface Props {
  isOpen: boolean;
  zones: Zone[];
  preselectedZoneId?: string;
  onClose: () => void;
  onAdd: (item: ImprovementItem) => void;
}

const EMPTY = {
  title: "",
  type: "Otro",
  estimatedCost: "",
  quantity: "1",
  purchaseUrl: "",
  description: "",
  notes: "",
};

export function AddItemModal({ isOpen, zones, preselectedZoneId, onClose, onAdd }: Props) {
  const { form, set } = useForm(EMPTY);
  const [zoneId, setZoneId] = useState(() => preselectedZoneId ?? zones[0]?.id ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ImprovementItem = {
      id: crypto.randomUUID(),
      zoneId,
      title: form.title.trim(),
      type: form.type as ImprovementItem["type"],
      estimatedCost: form.estimatedCost.trim() === "" ? null : Number(form.estimatedCost),
      quantity: form.quantity.trim() === "" ? undefined : Number(form.quantity),
      purchaseUrl: form.purchaseUrl.trim() || undefined,
      description: form.description.trim() || undefined,
      notes: form.notes.trim() || undefined,
      done: false,
      createdAt: new Date().toISOString(),
    };
    onAdd(item);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} maxWidth="lg" title="Nueva mejora">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ItemFormFields
          form={form}
          set={set}
          titlePlaceholder="Pintar paredes"
          submitLabel="Agregar ✓"
          onClose={onClose}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Zona *">
              <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)} required>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.emoji ? `${z.emoji} ${z.name}` : z.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Cantidad">
              <Input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={set("quantity")}
                placeholder="1"
              />
            </Field>
          </div>
          <Field label="Costo estimado por unidad ($)">
            <Input
              type="number"
              min="0"
              value={form.estimatedCost}
              onChange={set("estimatedCost")}
              placeholder="15000"
            />
          </Field>
        </ItemFormFields>
      </form>
    </ModalShell>
  );
}

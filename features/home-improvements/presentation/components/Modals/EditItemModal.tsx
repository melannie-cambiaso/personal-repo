"use client";

import { useForm } from "@/shared/hooks/useForm";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell, Field, Input } from "@/shared/components";
import { ItemFormFields, parseItemForm } from "./ItemFormFields";

interface Props {
  item: ImprovementItem | null;
  zones: Zone[];
  onClose: () => void;
  onSave: (item: ImprovementItem) => void;
}

export function EditItemModal({ item, zones, onClose, onSave }: Props) {
  const isOpen = item !== null;

  const { form, set } = useForm({
    title: item?.title ?? "",
    type: item?.type ?? "Otro",
    estimatedCost: item?.estimatedCost?.toString() ?? "",
    quantity: item?.quantity?.toString() ?? "1",
    purchaseUrl: item?.purchaseUrl ?? "",
    description: item?.description ?? "",
    notes: item?.notes ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    onSave({ ...item, ...parseItemForm(form) });
    onClose();
  };

  const zone = zones.find((z) => z.id === item?.zoneId);

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} maxWidth="lg" title="Editar mejora">
      {zone && (
        <p className="text-2xs tracking-store text-brown-400 mb-4 font-semibold uppercase">
          Zona: {zone.emoji ? `${zone.emoji} ` : ""}
          {zone.name}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ItemFormFields form={form} set={set} submitLabel="Guardar ✓" onClose={onClose}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cantidad">
              <Input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={set("quantity")}
              />
            </Field>
            <Field label="Costo estimado por unidad ($)">
              <Input
                type="number"
                min="0"
                value={form.estimatedCost}
                onChange={set("estimatedCost")}
              />
            </Field>
          </div>
        </ItemFormFields>
      </form>
    </ModalShell>
  );
}

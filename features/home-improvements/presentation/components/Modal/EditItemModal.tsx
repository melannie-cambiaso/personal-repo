"use client";

import { useEffect, useState } from "react";
import type {
  ImprovementItem,
  ImprovementType,
} from "@/features/home-improvements/domain/ImprovementItem";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field, Input, Textarea, Select } from "@/shared/components";

const TYPES: ImprovementType[] = [
  "Decoración",
  "Organización",
  "Reparación",
  "Instalación",
  "Otro",
];

interface Props {
  isOpen: boolean;
  item: ImprovementItem | null;
  zones: Zone[];
  onClose: () => void;
  onSave: (item: ImprovementItem) => void;
}

export function EditItemModal({ isOpen, item, zones, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    title: "",
    type: "Otro" as ImprovementType,
    estimatedCost: "",
    quantity: "1",
    purchaseUrl: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen && item) {
      setForm({
        title: item.title,
        type: item.type,
        estimatedCost: item.estimatedCost?.toString() ?? "",
        quantity: item.quantity?.toString() ?? "1",
        purchaseUrl: item.purchaseUrl ?? "",
        description: item.description ?? "",
        notes: item.notes ?? "",
      });
    }
  }, [isOpen, item]);

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    onSave({
      ...item,
      title: form.title.trim(),
      type: form.type,
      estimatedCost: form.estimatedCost.trim() === "" ? null : Number(form.estimatedCost),
      quantity: form.quantity.trim() === "" ? undefined : Number(form.quantity),
      purchaseUrl: form.purchaseUrl.trim() || undefined,
      description: form.description.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Título *">
            <Input value={form.title} onChange={set("title")} required />
          </Field>
          <Field label="Tipo *">
            <Select value={form.type} onChange={set("type")}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>
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
        <Field label="Dónde comprarlo (URL)">
          <Input
            type="url"
            value={form.purchaseUrl}
            onChange={set("purchaseUrl")}
            placeholder="https://..."
          />
        </Field>
        <Field label="Descripción">
          <Textarea
            rows={2}
            value={form.description}
            onChange={set("description")}
          />
        </Field>
        <Field label="Notas">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={set("notes")}
          />
        </Field>
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Guardar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

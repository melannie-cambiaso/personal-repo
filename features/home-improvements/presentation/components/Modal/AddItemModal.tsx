"use client";

import { useEffect, useState } from "react";
import type {
  ImprovementItem,
  ImprovementType,
} from "@/features/home-improvements/domain/ImprovementItem";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field } from "@/shared/components";

const TYPES: ImprovementType[] = [
  "Decoración",
  "Organización",
  "Reparación",
  "Instalación",
  "Otro",
];

interface Props {
  isOpen: boolean;
  zones: Zone[];
  preselectedZoneId?: string;
  onClose: () => void;
  onAdd: (item: ImprovementItem) => void;
}

const EMPTY = {
  title: "",
  type: "Otro" as ImprovementType,
  estimatedCost: "",
  quantity: "1",
  purchaseUrl: "",
  description: "",
  notes: "",
};

export function AddItemModal({ isOpen, zones, preselectedZoneId, onClose, onAdd }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [zoneId, setZoneId] = useState(preselectedZoneId ?? zones[0]?.id ?? "");

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setZoneId(preselectedZoneId ?? zones[0]?.id ?? "");
    }
  }, [isOpen, preselectedZoneId, zones]);

  const set =
    (field: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ImprovementItem = {
      id: crypto.randomUUID(),
      zoneId,
      title: form.title.trim(),
      type: form.type,
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
    <ModalShell isOpen={isOpen} onCancel={onClose} maxWidth="lg">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-dancing text-brown-900 text-2xl font-bold">Nueva mejora</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-brown-400 hover:text-brown-800 cursor-pointer text-xl transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Título *">
            <input
              className={input}
              value={form.title}
              onChange={set("title")}
              required
              placeholder="Pintar paredes"
            />
          </Field>
          <Field label="Tipo *">
            <select className={input} value={form.type} onChange={set("type")}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Zona *">
            <select
              className={input}
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              required
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.emoji ? `${z.emoji} ${z.name}` : z.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad">
            <input
              className={input}
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
          <input
            className={input}
            type="number"
            min="0"
            value={form.estimatedCost}
            onChange={set("estimatedCost")}
            placeholder="15000"
          />
        </Field>
        <Field label="Dónde comprarlo (URL)">
          <input
            className={input}
            type="url"
            value={form.purchaseUrl}
            onChange={set("purchaseUrl")}
            placeholder="https://..."
          />
        </Field>
        <Field label="Descripción">
          <textarea
            className={`${input} resize-none`}
            rows={2}
            value={form.description}
            onChange={set("description")}
          />
        </Field>
        <Field label="Notas">
          <textarea
            className={`${input} resize-none`}
            rows={2}
            value={form.notes}
            onChange={set("notes")}
          />
        </Field>
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} className="secondary">
            Cancelar
          </Button>
          <Button type="submit" className="primary">
            Agregar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

const input =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";

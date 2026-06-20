"use client";

import { useEffect, useRef, useState } from "react";
import type { ImprovementItem, ImprovementType } from "@/features/home-improvements/domain/ImprovementItem";
import type { Zone } from "@/features/home-improvements/domain/Zone";

const TYPES: ImprovementType[] = ["Decoración", "Organización", "Reparación", "Instalación", "Otro"];

interface Props {
  isOpen: boolean;
  zones: Zone[];
  preselectedZoneId?: string;
  onClose: () => void;
  onAdd: (item: ImprovementItem) => void;
}

const EMPTY = { title: "", type: "Otro" as ImprovementType, estimatedCost: "", purchaseUrl: "", description: "", notes: "" };

export function AddItemModal({ isOpen, zones, preselectedZoneId, onClose, onAdd }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(EMPTY);
  const [zoneId, setZoneId] = useState(preselectedZoneId ?? zones[0]?.id ?? "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      setForm(EMPTY);
      setZoneId(preselectedZoneId ?? zones[0]?.id ?? "");
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen, preselectedZoneId, zones]);

  const set = (field: keyof typeof EMPTY) =>
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
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-lg rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
    >
      <div className="px-6 py-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-dancing text-2xl font-bold text-brown-900">Nueva mejora</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-xl text-brown-400 transition-colors hover:text-brown-800" aria-label="Cerrar">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Título *">
              <input className={input} value={form.title} onChange={set("title")} required placeholder="Pintar paredes" />
            </Field>
            <Field label="Tipo *">
              <select className={input} value={form.type} onChange={set("type")}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Zona *">
              <select className={input} value={zoneId} onChange={(e) => setZoneId(e.target.value)} required>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.emoji ? `${z.emoji} ${z.name}` : z.name}</option>)}
              </select>
            </Field>
            <Field label="Costo estimado ($)">
              <input className={input} type="number" min="0" value={form.estimatedCost} onChange={set("estimatedCost")} placeholder="15000" />
            </Field>
          </div>
          <Field label="Dónde comprarlo (URL)">
            <input className={input} type="url" value={form.purchaseUrl} onChange={set("purchaseUrl")} placeholder="https://..." />
          </Field>
          <Field label="Descripción">
            <textarea className={`${input} resize-none`} rows={2} value={form.description} onChange={set("description")} />
          </Field>
          <Field label="Notas">
            <textarea className={`${input} resize-none`} rows={2} value={form.notes} onChange={set("notes")} />
          </Field>
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
            <button type="submit" className={btnPrimary}>Agregar ✓</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs font-semibold uppercase tracking-store text-brown-400">{label}</span>
      {children}
    </label>
  );
}

const input = "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";
const btnSecondary = "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnPrimary = "cursor-pointer rounded-lg bg-brown-800 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700";

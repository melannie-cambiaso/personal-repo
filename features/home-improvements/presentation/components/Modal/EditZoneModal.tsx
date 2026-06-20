"use client";

import { useEffect, useRef, useState } from "react";
import type { Zone } from "@/features/home-improvements/domain/Zone";

interface Props {
  isOpen: boolean;
  zone: Zone | null;
  onClose: () => void;
  onSave: (zone: Zone) => boolean;
}

export function EditZoneModal({ isOpen, zone, onClose, onSave }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState({ name: "", emoji: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && zone) { setForm({ name: zone.name, emoji: zone.emoji ?? "" }); setError(""); dialog.showModal(); }
    else dialog.close();
  }, [isOpen, zone]);

  const set = (field: "name" | "emoji") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;
    const ok = onSave({ ...zone, name: form.name.trim(), emoji: form.emoji.trim() || undefined });
    if (!ok) { setError("Ya existe una zona con ese nombre."); return; }
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-sm rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
    >
      <div className="px-6 py-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-dancing text-2xl font-bold text-brown-900">Editar zona</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-xl text-brown-400 transition-colors hover:text-brown-800" aria-label="Cerrar">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nombre *">
            <input className={input} value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="Emoji">
            <input className={input} value={form.emoji} onChange={set("emoji")} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
            <button type="submit" className={btnPrimary}>Guardar ✓</button>
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

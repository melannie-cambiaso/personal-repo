"use client";

import { useEffect, useState } from "react";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field } from "@/shared/components";

interface Props {
  isOpen: boolean;
  zone: Zone | null;
  onClose: () => void;
  onSave: (zone: Zone) => boolean;
}

export function EditZoneModal({ isOpen, zone, onClose, onSave }: Props) {
  const [form, setForm] = useState({ name: "", emoji: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && zone) {
      setForm({ name: zone.name, emoji: zone.emoji ?? "" });
      setError("");
    }
  }, [isOpen, zone]);

  const set = (field: "name" | "emoji") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;
    const ok = onSave({ ...zone, name: form.name.trim(), emoji: form.emoji.trim() || undefined });
    if (!ok) {
      setError("Ya existe una zona con ese nombre.");
      return;
    }
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} maxWidth="sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-dancing text-brown-900 text-2xl font-bold">Editar zona</h2>
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
        <Field label="Nombre *">
          <input className={input} value={form.name} onChange={set("name")} required />
        </Field>
        <Field label="Emoji">
          <input className={input} value={form.emoji} onChange={set("emoji")} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} className="secondary">
            Cancelar
          </Button>
          <Button type="submit" className="secondary">
            Guardar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

const input =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";

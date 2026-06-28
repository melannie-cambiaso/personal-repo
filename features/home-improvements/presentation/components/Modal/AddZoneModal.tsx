"use client";

import { useEffect, useState } from "react";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field } from "@/shared/components";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (zone: Zone) => boolean;
}

const EMPTY = { name: "", emoji: "" };

export function AddZoneModal({ isOpen, onClose, onAdd }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setError("");
    }
  }, [isOpen]);

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const zone: Zone = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      emoji: form.emoji.trim() || undefined,
    };
    const ok = onAdd(zone);
    if (!ok) {
      setError("Ya existe una zona con ese nombre.");
      return;
    }
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} maxWidth="sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-dancing text-brown-900 text-2xl font-bold">Nueva zona</h2>
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
          <input
            className={input}
            value={form.name}
            onChange={set("name")}
            required
            placeholder="Cocina"
          />
        </Field>
        <Field label="Emoji">
          <input className={input} value={form.emoji} onChange={set("emoji")} placeholder="🍳" />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
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

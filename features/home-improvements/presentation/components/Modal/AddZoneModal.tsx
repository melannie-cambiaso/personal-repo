"use client";

import { useEffect, useState } from "react";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field, inputClass } from "@/shared/components";

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
    <ModalShell isOpen={isOpen} onCancel={onClose} maxWidth="sm" title="Nueva zona">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre *">
          <input
            className={inputClass}
            value={form.name}
            onChange={set("name")}
            required
            placeholder="Cocina"
          />
        </Field>
        <Field label="Emoji">
          <input className={inputClass} value={form.emoji} onChange={set("emoji")} placeholder="🍳" />
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

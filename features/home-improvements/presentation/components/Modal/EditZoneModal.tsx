"use client";

import { useEffect, useState } from "react";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field, Input } from "@/shared/components";

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
    <ModalShell isOpen={isOpen} onCancel={onClose} maxWidth="sm" title="Editar zona">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre *">
          <Input value={form.name} onChange={set("name")} required />
        </Field>
        <Field label="Emoji">
          <Input value={form.emoji} onChange={set("emoji")} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="secondary">
            Guardar ✓
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

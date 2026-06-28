"use client";

import { useState } from "react";
import { useForm } from "@/shared/hooks/useForm";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell } from "@/shared/components";
import { ZoneFormFields } from "./ZoneFormFields";

interface Props {
  zone: Zone | null;
  onClose: () => void;
  onSave: (zone: Zone) => boolean;
}

export function EditZoneModal({ zone, onClose, onSave }: Props) {
  const isOpen = zone !== null;

  const { form, set } = useForm({ name: zone?.name ?? "", emoji: zone?.emoji ?? "" });
  const [error, setError] = useState("");

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
        <ZoneFormFields
          form={form}
          set={set}
          error={error}
          submitLabel="Guardar ✓"
          onClose={onClose}
        />
      </form>
    </ModalShell>
  );
}

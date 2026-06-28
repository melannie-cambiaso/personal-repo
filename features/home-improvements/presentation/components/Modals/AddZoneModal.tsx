"use client";

import { useState } from "react";
import { useForm } from "@/shared/hooks/useForm";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import { ModalShell } from "@/shared/components";
import { ZoneFormFields } from "./ZoneFormFields";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (zone: Zone) => boolean;
}

const EMPTY = { name: "", emoji: "" };

export function AddZoneModal({ isOpen, onClose, onAdd }: Props) {
  const { form, set } = useForm(EMPTY);
  const [error, setError] = useState("");

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
        <ZoneFormFields
          form={form}
          set={set}
          error={error}
          namePlaceholder="Cocina"
          emojiPlaceholder="🍳"
          submitLabel="Agregar ✓"
          onClose={onClose}
        />
      </form>
    </ModalShell>
  );
}

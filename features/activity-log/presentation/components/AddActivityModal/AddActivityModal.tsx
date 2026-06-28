"use client";

import { useEffect, useState } from "react";
import type { Person } from "@/features/activity-log/domain";
import { PEOPLE } from "@/features/activity-log/domain";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field, Input, Textarea } from "@/shared/components";

interface SubmitData {
  date: string;
  person: Person;
  activity: string;
  notes?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmitData) => Promise<void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  date: today(),
  person: "Meme" as Person,
  activity: "",
  notes: "",
};

export function AddActivityModal({ isOpen, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [activityError, setActivityError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, date: today() });
      setActivityError(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.activity.trim()) {
      setActivityError(true);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        date: form.date,
        person: form.person,
        activity: form.activity.trim(),
        notes: form.notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} title="Nueva actividad">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Fecha *">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
        </Field>

        <Field label="Persona *">
          <div className="flex gap-2">
            {PEOPLE.map((person) => (
              <button
                key={person}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, person }))}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  form.person === person
                    ? person === "Meme"
                      ? "border-pink-400 bg-pink-100 text-pink-700"
                      : "border-blue-400 bg-blue-100 text-blue-700"
                    : "border-cream-400 text-brown-600 hover:border-brown-400 bg-white"
                }`}
              >
                {person}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Actividad *">
          <Input
            className={activityError ? "border-red-400" : undefined}
            type="text"
            value={form.activity}
            onChange={(e) => {
              setActivityError(false);
              setForm((prev) => ({ ...prev, activity: e.target.value }));
            }}
            placeholder="¿Qué hicieron?"
          />
          {activityError && (
            <span className="text-xs text-red-500">La actividad es obligatoria.</span>
          )}
        </Field>

        <Field label="Notas">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Detalles opcionales..."
          />
        </Field>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} variant="primary">
            {submitting ? "Guardando..." : "Agregar ✓"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

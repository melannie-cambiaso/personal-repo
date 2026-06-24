"use client";

import { useEffect, useRef, useState } from "react";
import type { Person } from "@/features/activity-log/domain";
import { PEOPLE } from "@/features/activity-log/domain";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [activityError, setActivityError] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      setForm({ ...EMPTY_FORM, date: today() });
      setActivityError(false);
      dialog.showModal();
    } else {
      dialog.close();
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
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-md rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="px-6 py-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-dancing text-2xl font-bold text-brown-900">
            Nueva actividad
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-xl text-brown-400 transition-colors hover:text-brown-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Fecha *">
            <input
              className={input}
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
                      : "border-cream-400 bg-white text-brown-600 hover:border-brown-400"
                  }`}
                >
                  {person}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Actividad *">
            <input
              className={`${input} ${activityError ? "border-red-400" : ""}`}
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
            <textarea
              className={`${input} resize-none`}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Detalles opcionales..."
            />
          </Field>

          <div className="mt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? "Guardando..." : "Agregar ✓"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs font-semibold uppercase tracking-store text-brown-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const input =
  "w-full rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600";
const btnSecondary =
  "cursor-pointer rounded-lg border border-brown-300 px-4 py-2 text-2xs font-bold text-brown-600 transition-colors hover:bg-cream-300";
const btnPrimary =
  "cursor-pointer rounded-lg bg-brown-800 px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700 disabled:opacity-50 disabled:cursor-not-allowed";

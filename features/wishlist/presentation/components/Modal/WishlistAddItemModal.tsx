"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/features/wishlist/data";
import type { CategoryColor } from "@/features/wishlist/domain/Category";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: WishlistItem) => void;
}

const EMPTY = {
  title: "",
  brand: "",
  description: "",
  emoji: "",
  price: "",
  tag: "",
  url: "",
  image: "",
  categoryKey: "food" as CategoryColor,
};

export function WishlistAddItemModal({ isOpen, onClose, onAdd }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    isOpen ? dialog.showModal() : dialog.close();
  }, [isOpen]);

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: WishlistItem = {
      id: crypto.randomUUID(),
      category: CATEGORIES[form.categoryKey],
      emoji: form.emoji,
      brand: form.brand,
      title: form.title,
      description: form.description,
      tag: form.tag || undefined,
      price: form.price.trim() === "" ? null : Number(form.price),
      url: form.url || undefined,
      image: form.image || undefined,
    };
    onAdd(item);
    setForm(EMPTY);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-lg rounded-2xl bg-cream-50 p-0 shadow-card-hover backdrop:bg-brown-900/40"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={handleBackdrop}
    >
      <div className="px-6 py-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-dancing text-2xl font-bold text-brown-900">Nuevo item</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Título" required>
              <input className={input} value={form.title} onChange={set("title")} required />
            </Field>
            <Field label="Marca / Tienda" required>
              <input className={input} value={form.brand} onChange={set("brand")} required />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría" required>
              <select className={input} value={form.categoryKey} onChange={set("categoryKey")} required>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Emoji" required>
              <input className={input} value={form.emoji} onChange={set("emoji")} required placeholder="☕" />
            </Field>
          </div>

          <Field label="Descripción" required>
            <textarea
              className={`${input} resize-none`}
              rows={3}
              value={form.description}
              onChange={set("description")}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio (CLP)">
              <input className={input} type="number" min="0" value={form.price} onChange={set("price")} placeholder="23990" />
            </Field>
            <Field label="Tag">
              <input className={input} value={form.tag} onChange={set("tag")} placeholder="Suscripción mensual" />
            </Field>
          </div>

          <Field label="URL del producto">
            <input className={input} type="url" value={form.url} onChange={set("url")} placeholder="https://..." />
          </Field>

          <Field label="URL de imagen">
            <input className={input} type="url" value={form.image} onChange={set("image")} placeholder="https://..." />
          </Field>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-2xs border-brown-300 text-brown-600 hover:bg-cream-300 rounded-lg border px-4 py-2 font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-2xs bg-brown-800 hover:bg-brown-700 rounded-lg px-4 py-2 font-bold text-white transition-colors cursor-pointer"
            >
              Agregar ✓
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs text-brown-400 tracking-store font-semibold uppercase">
        {label}{required && " *"}
      </span>
      {children}
    </label>
  );
}

const input = "rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none focus:border-brown-600 transition-colors w-full";

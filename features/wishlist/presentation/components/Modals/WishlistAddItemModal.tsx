"use client";

import { useState } from "react";
import { CATEGORIES } from "@/features/wishlist/data";
import type { CategoryColor } from "@/features/wishlist/domain/Category";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";
import { ModalShell } from "@/shared/components/ModalShell/ModalShell";
import { Button, Field, Input, Textarea, Select } from "@/shared/components";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: WishlistItem) => void;
  editItem?: WishlistItem;
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

function formFromItem(item: WishlistItem) {
  return {
    title: item.title,
    brand: item.brand,
    description: item.description,
    emoji: item.emoji,
    price: item.price?.toString() ?? "",
    tag: item.tag ?? "",
    url: item.url ?? "",
    image: item.image ?? "",
    categoryKey: item.category.color,
  };
}

export function WishlistAddItemModal({ isOpen, onClose, onAdd, editItem }: Props) {
  const [form, setForm] = useState(() => (editItem ? formFromItem(editItem) : EMPTY));

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: WishlistItem = {
      id: editItem?.id ?? crypto.randomUUID(),
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
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onCancel={onClose} maxWidth="lg" title={editItem ? "Editar item" : "Nuevo item"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Título *">
            <Input value={form.title} onChange={set("title")} required />
          </Field>
          <Field label="Marca / Tienda *">
            <Input value={form.brand} onChange={set("brand")} required />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoría *">
            <Select value={form.categoryKey} onChange={set("categoryKey")} required>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Emoji *">
            <Input value={form.emoji} onChange={set("emoji")} required placeholder="☕" />
          </Field>
        </div>

        <Field label="Descripción *">
          <Textarea rows={3} value={form.description} onChange={set("description")} required />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio (CLP)">
            <Input type="number" min="0" value={form.price} onChange={set("price")} placeholder="23990" />
          </Field>
          <Field label="Tag">
            <Input value={form.tag} onChange={set("tag")} placeholder="Suscripción mensual" />
          </Field>
        </div>

        <Field label="URL del producto">
          <Input type="url" value={form.url} onChange={set("url")} placeholder="https://..." />
        </Field>

        <Field label="URL de imagen">
          <Input type="url" value={form.image} onChange={set("image")} placeholder="https://..." />
        </Field>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" onPress={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {editItem ? "Guardar ✓" : "Agregar ✓"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

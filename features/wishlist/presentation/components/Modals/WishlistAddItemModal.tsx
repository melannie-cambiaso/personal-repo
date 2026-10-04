"use client";

import { useForm } from "@/shared/hooks/useForm";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";
import {
  PRIORITY_LABELS,
  resolvePriority,
  type WishlistPriority,
} from "@/features/wishlist/domain";
import { ModalShell, Button, Field, Input, Textarea, Select } from "@/shared/components";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: WishlistItem) => void;
  editItem?: WishlistItem;
}

const EMPTY = {
  title: "",
  description: "",
  emoji: "",
  price: "",
  tag: "",
  url: "",
  priority: "medium" as WishlistPriority,
};

// The optional fields fall back to "" because these inputs are controlled: an item
// saved through the quick path carries none of them, and feeding `undefined` into a
// controlled input would make React switch it to uncontrolled mid-edit.
function formFromItem(item: WishlistItem) {
  return {
    title: item.title,
    description: item.description ?? "",
    emoji: item.emoji ?? "",
    price: item.price?.toString() ?? "",
    tag: item.tag ?? "",
    url: item.url ?? "",
    priority: resolvePriority(item),
  };
}

// `null` for anything that is not a usable price, so the submit handler can refuse
// it: `Number("")` is 0, which would quietly save a blank field as a free item.
function parsePrice(raw: string): number | null {
  if (raw.trim() === "") return null;
  const price = Number(raw);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function WishlistAddItemModal({ isOpen, onClose, onAdd, editItem }: Props) {
  const { form, set } = useForm(editItem ? formFromItem(editItem) : EMPTY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The `required` attribute only guards the browser path; a programmatic submit
    // skips constraint validation, so the handler refuses a missing price or link too.
    const price = parsePrice(form.price);
    const url = form.url.trim();
    if (price === null || url === "") return;
    const item: WishlistItem = {
      id: editItem?.id ?? crypto.randomUUID(),
      // `|| undefined`, not the raw value: a blank optional must be absent, not an
      // empty string, or the list renders an empty tag pill instead of none.
      emoji: form.emoji || undefined,
      title: form.title,
      description: form.description || undefined,
      tag: form.tag || undefined,
      price,
      priority: form.priority,
      url,
      // No longer asked for (the list shows no image), but an item saved with one
      // keeps it.
      image: editItem?.image,
    };
    onAdd(item);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onCancel={onClose}
      maxWidth="lg"
      title={editItem ? "Editar item" : "Nuevo item"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title, price and link sit above the divider, stacked rather than paired:
            they are the whole cost of capturing an idea, and everything below can
            wait. */}
        <Field label="Título *">
          <Input value={form.title} onChange={set("title")} required autoFocus />
        </Field>

        <Field label="Precio (CLP) *">
          <Input
            type="number"
            min="0"
            value={form.price}
            onChange={set("price")}
            placeholder="23990"
            required
          />
        </Field>

        <Field label="URL del producto *">
          <Input
            type="url"
            value={form.url}
            onChange={set("url")}
            placeholder="https://..."
            required
          />
        </Field>

        <div className="border-blush-300 flex items-center gap-2 border-t-2 border-dashed pt-4">
          <span className="text-brown-500 text-sm">
            Lo demás es opcional — podés completarlo después
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Emoji">
            <Input value={form.emoji} onChange={set("emoji")} placeholder="☕" />
          </Field>
          <Field label="Prioridad">
            <Select value={form.priority} onChange={set("priority")}>
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Descripción">
          <Textarea rows={2} value={form.description} onChange={set("description")} />
        </Field>

        <Field label="Tag">
          <Input value={form.tag} onChange={set("tag")} placeholder="Suscripción mensual" />
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

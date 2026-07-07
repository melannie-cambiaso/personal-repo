import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import { IMPROVEMENT_TYPES } from "@/features/home-improvements/domain/ImprovementItem";
import { Button, Field, Input, Select, Textarea } from "@/shared/components";

export interface ItemFormSlice {
  title: string;
  type: string;
  quantity: string;
  estimatedCost: string;
  purchaseUrl: string;
  description: string;
  notes: string;
}

export function parseItemForm(form: ItemFormSlice) {
  return {
    title: form.title.trim(),
    type: form.type as ImprovementItem["type"],
    estimatedCost: form.estimatedCost.trim() === "" ? null : Number(form.estimatedCost),
    quantity: form.quantity.trim() === "" ? undefined : Number(form.quantity),
    purchaseUrl: form.purchaseUrl.trim() || undefined,
    description: form.description.trim() || undefined,
    notes: form.notes.trim() || undefined,
  };
}

type ChangeHandler = React.ChangeEventHandler<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

interface Props {
  form: ItemFormSlice;
  set: (field: keyof ItemFormSlice) => ChangeHandler;
  titlePlaceholder?: string;
  submitLabel: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function ItemFormFields({
  form,
  set,
  titlePlaceholder,
  submitLabel,
  onClose,
  children,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Título *">
          <Input
            value={form.title}
            onChange={set("title")}
            required
            placeholder={titlePlaceholder}
          />
        </Field>
        <Field label="Tipo *">
          <Select value={form.type} onChange={set("type")}>
            {IMPROVEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {children}
      <Field label="Dónde comprarlo (URL)">
        <Input
          type="url"
          value={form.purchaseUrl}
          onChange={set("purchaseUrl")}
          placeholder="https://..."
        />
      </Field>
      <Field label="Descripción">
        <Textarea rows={2} value={form.description} onChange={set("description")} />
      </Field>
      <Field label="Notas">
        <Textarea rows={2} value={form.notes} onChange={set("notes")} />
      </Field>
      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" onPress={onClose} variant="secondary">
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </>
  );
}

import { IMPROVEMENT_TYPES } from "@/features/home-improvements/domain/ImprovementItem";
import { Button, Field, Input, Select, Textarea } from "@/shared/components";

interface FormSlice {
  title: string;
  type: string;
  purchaseUrl: string;
  description: string;
  notes: string;
}

type ChangeHandler = React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

interface Props {
  form: FormSlice;
  set: (field: keyof FormSlice) => ChangeHandler;
  titlePlaceholder?: string;
  submitLabel: string;
  onClose: () => void;
  children?: React.ReactNode;
}

export function ItemFormFields({ form, set, titlePlaceholder, submitLabel, onClose, children }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Título *">
          <Input value={form.title} onChange={set("title")} required placeholder={titlePlaceholder} />
        </Field>
        <Field label="Tipo *">
          <Select value={form.type} onChange={set("type")}>
            {IMPROVEMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
      </div>
      {children}
      <Field label="Dónde comprarlo (URL)">
        <Input type="url" value={form.purchaseUrl} onChange={set("purchaseUrl")} placeholder="https://..." />
      </Field>
      <Field label="Descripción">
        <Textarea rows={2} value={form.description} onChange={set("description")} />
      </Field>
      <Field label="Notas">
        <Textarea rows={2} value={form.notes} onChange={set("notes")} />
      </Field>
      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" onPress={onClose} variant="secondary">Cancelar</Button>
        <Button type="submit" variant="primary">{submitLabel}</Button>
      </div>
    </>
  );
}

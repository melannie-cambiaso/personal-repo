import { Button, Field, Input } from "@/shared/components";

interface FormSlice {
  name: string;
  emoji: string;
}

type ChangeHandler = React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

interface Props {
  form: FormSlice;
  set: (field: keyof FormSlice) => ChangeHandler;
  error: string;
  namePlaceholder?: string;
  emojiPlaceholder?: string;
  submitLabel: string;
  onClose: () => void;
}

export function ZoneFormFields({ form, set, error, namePlaceholder, emojiPlaceholder, submitLabel, onClose }: Props) {
  return (
    <>
      <Field label="Nombre *">
        <Input value={form.name} onChange={set("name")} required placeholder={namePlaceholder} />
      </Field>
      <Field label="Emoji">
        <Input value={form.emoji} onChange={set("emoji")} placeholder={emojiPlaceholder} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" onPress={onClose} variant="secondary">Cancelar</Button>
        <Button type="submit" variant="primary">{submitLabel}</Button>
      </div>
    </>
  );
}

import { ModalShell, Field, Input, Textarea } from "@/shared/components";

type EntryField = "amount" | "date" | "notes" | "toReplenish";

interface Props {
  form: { amount: string; date: string; notes: string; toReplenish: boolean };
  showReplenish: boolean;
  setField: (field: EntryField) => React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  amountPlaceholder?: string;
}

export function EntryFormFields({ form, showReplenish, setField, amountPlaceholder }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Monto * ($)">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={setField("amount")}
            required
            placeholder={amountPlaceholder}
          />
        </Field>
        <Field label="Fecha *">
          <Input type="date" value={form.date} onChange={setField("date")} required />
        </Field>
      </div>
      <Field label="Notas">
        <Textarea rows={2} value={form.notes} onChange={setField("notes")} />
      </Field>
      {showReplenish && (
        <label className="text-brown-700 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.toReplenish}
            onChange={setField("toReplenish")}
            className="accent-brown-700 h-4 w-4"
          />
          A reponer este mes
        </label>
      )}
    </>
  );
}

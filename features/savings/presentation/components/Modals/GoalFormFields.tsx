import { ModalShell, Field, Input } from "@/shared/components";

export function validateGoalForm(form: { name: string; targetAmount: string }): string | null {
  if (!form.name.trim()) return "El nombre es obligatorio.";
  if (Number(form.targetAmount) <= 0) return "El monto debe ser mayor a 0.";
  return null;
}

type GoalForm = { name: string; targetAmount: string };

interface Props {
  form: GoalForm;
  error: string | null;
  setForm: React.Dispatch<React.SetStateAction<GoalForm>>;
  namePlaceholder?: string;
  amountPlaceholder?: string;
}

export function GoalFormFields({
  form,
  error,
  setForm,
  namePlaceholder,
  amountPlaceholder,
}: Props) {
  return (
    <>
      <Field label="Nombre *">
        <Input
          type="text"
          maxLength={60}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
          placeholder={namePlaceholder}
        />
      </Field>
      <Field label="Monto objetivo * ($)">
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={form.targetAmount}
          onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
          required
          placeholder={amountPlaceholder}
        />
      </Field>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </>
  );
}

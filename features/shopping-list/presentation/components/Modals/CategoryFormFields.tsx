import { Field, Input } from "@/shared/components";
import { validateCategoryName } from "@/features/shopping-list/domain";

export function validateCategoryForm(form: { name: string }): string | null {
  if (!validateCategoryName(form.name)) return "El nombre es obligatorio.";
  return null;
}

type CategoryForm = { name: string };

interface Props {
  form: CategoryForm;
  error: string | null;
  setForm: React.Dispatch<React.SetStateAction<CategoryForm>>;
  placeholder?: string;
}

export function CategoryFormFields({ form, error, setForm, placeholder }: Props) {
  return (
    <>
      <Field label="Nombre *">
        <Input
          type="text"
          maxLength={40}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
          placeholder={placeholder}
        />
      </Field>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </>
  );
}

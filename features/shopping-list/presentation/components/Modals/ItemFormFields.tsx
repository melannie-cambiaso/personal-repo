import { Field, Input, Select } from "@/shared/components";
import { validateCategoryName } from "@/features/shopping-list/domain";
import type { ShoppingCategory } from "@/features/shopping-list/domain";

export function validateItemForm(form: { name: string; categoryId: string }): string | null {
  if (!validateCategoryName(form.name)) return "El nombre es obligatorio.";
  if (!form.categoryId) return "Elegí una categoría.";
  return null;
}

type ItemForm = { name: string; categoryId: string };

interface Props {
  form: ItemForm;
  error: string | null;
  setForm: React.Dispatch<React.SetStateAction<ItemForm>>;
  categories: ShoppingCategory[];
  namePlaceholder?: string;
}

export function ItemFormFields({ form, error, setForm, categories, namePlaceholder }: Props) {
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
      <Field label="Categoría *">
        <Select
          value={form.categoryId}
          onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
          required
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
        />
      </Field>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </>
  );
}

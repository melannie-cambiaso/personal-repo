import { useState } from "react";

export function useForm<T extends Record<string, string>>(initial: T) {
  const [form, setForm] = useState(initial);
  const set = (field: keyof T) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }) as T);
  return { form, setForm, set };
}

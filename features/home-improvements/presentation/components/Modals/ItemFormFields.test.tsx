import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ItemFormFields, type ItemFormSlice } from "./ItemFormFields";

const baseForm: ItemFormSlice = {
  title: "",
  type: "Otro",
  quantity: "1",
  estimatedCost: "",
  purchaseUrl: "",
  description: "",
  notes: "",
};

function Harness() {
  const [form, setForm] = useState(baseForm);
  const set =
    (field: keyof ItemFormSlice) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  return <ItemFormFields form={form} set={set} submitLabel="Guardar ✓" onClose={vi.fn()} />;
}

describe("ItemFormFields", () => {
  it("renders every base field", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Título *")).toBeTruthy();
    expect(screen.getByLabelText("Tipo *")).toBeTruthy();
    expect(screen.getByLabelText("Dónde comprarlo (URL)")).toBeTruthy();
    expect(screen.getByLabelText("Descripción")).toBeTruthy();
    expect(screen.getByLabelText("Notas")).toBeTruthy();
  });

  it("lets the user type into the title field", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Pintar" } });
    expect((screen.getByLabelText("Título *") as HTMLInputElement).value).toBe("Pintar");
  });

  it("renders children between the base fields and the purchase URL field", () => {
    render(
      <ItemFormFields form={baseForm} set={() => vi.fn()} submitLabel="Guardar ✓" onClose={vi.fn()}>
        <div data-testid="slot">extra fields</div>
      </ItemFormFields>,
    );
    expect(screen.getByTestId("slot")).toBeTruthy();
  });
});

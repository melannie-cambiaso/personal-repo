import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EnvelopeConfigModal } from "./EnvelopeConfigModal";
import type { BudgetCategory, EnvelopeConfig } from "@/features/finance-v2/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const categories: BudgetCategory[] = [
  { id: "arriendo", name: "Arriendo", bucket: "fixed", amount: 350_000, subcategories: [] },
  {
    id: "cuentas",
    name: "Cuentas",
    bucket: "fixed",
    amount: 0,
    subcategories: [{ id: "luz", name: "Luz", bucket: "fixed", amount: 43_000 }],
  },
];

const existing: EnvelopeConfig = {
  name: "Servicios",
  boundCategoryId: "cuentas",
  openingBalance: 30_000,
  openingMonth: "2026-10",
};

describe("EnvelopeConfigModal", () => {
  it("offers only TOP-LEVEL budget categories as the bound category", () => {
    render(
      <EnvelopeConfigModal isOpen config={null} categories={categories} onClose={vi.fn()} onSave={vi.fn()} />
    );

    const select = screen.getByLabelText("Categoría vinculada") as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(["Arriendo", "Cuentas"]);
  });

  it("saves name, bound category and opening balance — and NOTHING about the opening month, which the hook owns", () => {
    const onSave = vi.fn();
    render(
      <EnvelopeConfigModal isOpen config={null} categories={categories} onClose={vi.fn()} onSave={onSave} />
    );

    fireEvent.change(screen.getByLabelText("Nombre de la cuenta"), { target: { value: "Servicios" } });
    fireEvent.change(screen.getByLabelText("Categoría vinculada"), { target: { value: "cuentas" } });
    fireEvent.change(screen.getByLabelText("Saldo inicial"), { target: { value: "30000" } });
    fireEvent.click(screen.getByText("Guardar cuenta"));

    expect(onSave).toHaveBeenCalledWith({
      name: "Servicios",
      boundCategoryId: "cuentas",
      openingBalance: 30_000,
    });
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("openingMonth");
  });

  it("closes after a successful save", () => {
    const onClose = vi.fn();
    render(
      <EnvelopeConfigModal isOpen config={null} categories={categories} onClose={onClose} onSave={vi.fn()} />
    );

    fireEvent.change(screen.getByLabelText("Nombre de la cuenta"), { target: { value: "Servicios" } });
    fireEvent.click(screen.getByText("Guardar cuenta"));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not save an envelope without a name", () => {
    const onSave = vi.fn();
    render(
      <EnvelopeConfigModal isOpen config={null} categories={categories} onClose={vi.fn()} onSave={onSave} />
    );

    fireEvent.change(screen.getByLabelText("Nombre de la cuenta"), { target: { value: "   " } });
    fireEvent.click(screen.getByText("Guardar cuenta"));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("treats an empty opening balance as zero", () => {
    const onSave = vi.fn();
    render(
      <EnvelopeConfigModal isOpen config={null} categories={categories} onClose={vi.fn()} onSave={onSave} />
    );

    fireEvent.change(screen.getByLabelText("Nombre de la cuenta"), { target: { value: "Servicios" } });
    fireEvent.click(screen.getByText("Guardar cuenta"));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ openingBalance: 0 }));
  });

  it("seeds the form from the existing config when editing", () => {
    render(
      <EnvelopeConfigModal isOpen config={existing} categories={categories} onClose={vi.fn()} onSave={vi.fn()} />
    );

    expect((screen.getByLabelText("Nombre de la cuenta") as HTMLInputElement).value).toBe("Servicios");
    expect((screen.getByLabelText("Categoría vinculada") as HTMLSelectElement).value).toBe("cuentas");
    expect((screen.getByLabelText("Saldo inicial") as HTMLInputElement).value).toBe("30000");
  });

  it("with no budget categories, explains that one is needed first and cannot save", () => {
    const onSave = vi.fn();
    render(<EnvelopeConfigModal isOpen config={null} categories={[]} onClose={vi.fn()} onSave={onSave} />);

    expect(screen.getByText(/Primero creá una categoría en Presupuesto/)).toBeTruthy();
    expect(screen.queryByLabelText("Categoría vinculada")).toBeNull();
    expect((screen.getByText("Guardar cuenta") as HTMLButtonElement).disabled).toBe(true);
  });

  it("the close control calls onClose", () => {
    const onClose = vi.fn();
    render(
      <EnvelopeConfigModal isOpen config={null} categories={categories} onClose={onClose} onSave={vi.fn()} />
    );

    fireEvent.click(screen.getByLabelText("Cerrar"));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddTransactionModal } from "./AddTransactionModal";

// jsdom does not implement HTMLDialogElement.showModal / close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  initialCategory: "Comida",
  allCategories: ["Comida", "Mercado"],
  onAdd: vi.fn(),
};

describe("AddTransactionModal", () => {
  it("renders the add form when isOpen is true", () => {
    render(<AddTransactionModal {...baseProps} />);
    // dialog is rendered but jsdom does not open it visually; use hidden:true to query inside
    expect(screen.getByRole("combobox", { hidden: true })).toBeTruthy();
    expect(screen.getByRole("spinbutton", { hidden: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: /agregar/i, hidden: true })).toBeTruthy();
  });

  it("does NOT render a transaction list", () => {
    render(<AddTransactionModal {...baseProps} />);
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("does NOT render any delete button", () => {
    render(<AddTransactionModal {...baseProps} />);
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
  });
});

describe("AddTransactionModal form reset", () => {
  const getCategory = () => screen.getByLabelText("Categoría") as HTMLSelectElement;
  const getAmount = () => screen.getByLabelText("Monto * ($)") as HTMLInputElement;
  const getNote = () => screen.getByLabelText("Nota (opcional)") as HTMLInputElement;

  it("resets amount, note and category when the modal is closed and reopened", () => {
    const { rerender } = render(<AddTransactionModal {...baseProps} />);
    fireEvent.change(getCategory(), { target: { value: "Mercado" } });
    fireEvent.change(getAmount(), { target: { value: "150" } });
    fireEvent.change(getNote(), { target: { value: "super" } });

    rerender(<AddTransactionModal {...baseProps} isOpen={false} />);
    rerender(<AddTransactionModal {...baseProps} isOpen />);

    expect(getCategory().value).toBe("Comida");
    expect(getAmount().value).toBe("");
    expect(getNote().value).toBe("");
  });

  it("follows a new initialCategory while open", () => {
    const { rerender } = render(<AddTransactionModal {...baseProps} />);
    expect(getCategory().value).toBe("Comida");

    rerender(<AddTransactionModal {...baseProps} initialCategory="Mercado" />);

    expect(getCategory().value).toBe("Mercado");
  });

  it("uses the latest initialCategory when reopened after it changed while closed", () => {
    const { rerender } = render(<AddTransactionModal {...baseProps} isOpen={false} />);
    rerender(<AddTransactionModal {...baseProps} isOpen={false} initialCategory="Mercado" />);
    rerender(<AddTransactionModal {...baseProps} isOpen initialCategory="Mercado" />);

    expect(getCategory().value).toBe("Mercado");
  });
});

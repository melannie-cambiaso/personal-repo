import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
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

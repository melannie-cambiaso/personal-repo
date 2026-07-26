import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddTransactionModal } from "./AddTransactionModal";
import type { ExpenseCategoryOption } from "@/features/finance-v2/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("AddTransactionModal", () => {
  const categoryOptions: ExpenseCategoryOption[] = [];

  it("renders the transaction form fields when open", () => {
    render(
      <AddTransactionModal
        isOpen
        month="2026-07"
        categoryOptions={categoryOptions}
        onClose={vi.fn()}
        onAdd={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Tipo de movimiento")).toBeTruthy();
    expect(screen.getByLabelText("Monto")).toBeTruthy();
  });

  it("submitting calls onAdd with the entered transaction, then onClose", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(
      <AddTransactionModal
        isOpen
        month="2026-07"
        categoryOptions={categoryOptions}
        onClose={onClose}
        onAdd={onAdd}
      />
    );

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "500" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ type: "income", amount: 500 }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("clicking the modal's close control calls onClose without calling onAdd", () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(
      <AddTransactionModal
        isOpen
        month="2026-07"
        categoryOptions={categoryOptions}
        onClose={onClose}
        onAdd={onAdd}
      />
    );

    fireEvent.click(screen.getByLabelText("Cerrar"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onAdd).not.toHaveBeenCalled();
  });
});

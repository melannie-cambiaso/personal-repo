import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddTransactionModal } from "./AddTransactionModal";
import type { ExpenseCategoryOption, FinanceV2Transaction } from "@/features/finance-v2/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("AddTransactionModal", () => {
  const categoryOptions: ExpenseCategoryOption[] = [];
  const editing: FinanceV2Transaction = {
    id: "t1",
    type: "income",
    amount: 500,
    date: "2026-07-03",
    month: "2026-07",
  };

  it("renders the transaction form fields when open", () => {
    render(
      <AddTransactionModal
        isOpen
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        hasEnvelope={false}
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
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        hasEnvelope={false}
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
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        hasEnvelope={false}
        onClose={onClose}
        onAdd={onAdd}
      />
    );

    fireEvent.click(screen.getByLabelText("Cerrar"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("in edit mode, titles the modal 'Editar movimiento'", () => {
    render(
      <AddTransactionModal
        isOpen
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        hasEnvelope={false}
        editingTransaction={editing}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText("Editar movimiento")).toBeTruthy();
  });

  it("in edit mode, submitting calls onUpdate with the id (not onAdd), then onClose", () => {
    const onAdd = vi.fn();
    const onUpdate = vi.fn();
    const onClose = vi.fn();
    render(
      <AddTransactionModal
        isOpen
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        hasEnvelope={false}
        editingTransaction={editing}
        onClose={onClose}
        onAdd={onAdd}
        onUpdate={onUpdate}
      />
    );

    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "900" } });
    fireEvent.click(screen.getByText("Guardar cambios"));

    expect(onUpdate).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({ type: "income", amount: 900 })
    );
    expect(onAdd).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});

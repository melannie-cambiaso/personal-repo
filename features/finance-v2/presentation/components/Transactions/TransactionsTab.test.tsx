import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionsTab } from "./TransactionsTab";
import type { DayGroup, ExpenseCategoryOption, TransactionTotals } from "@/features/finance-v2/domain";

describe("TransactionsTab", () => {
  const totals: TransactionTotals = { income: 1000, expense: 400, savings: 200, balance: 600 };
  const categoryOptions: ExpenseCategoryOption[] = [];

  it("wires the summary — shows balance and savings from the given totals", () => {
    render(
      <TransactionsTab
        month="2026-07"
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // "Ahorro" also appears as a select option in the wired form, so the summary's own
    // "Ahorro" label is asserted in MovementSummary.test.tsx instead — here we only need
    // to confirm the totals passed through, via their (unique) formatted amounts.
    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByText("$600")).toBeTruthy();
    expect(screen.getByText("$200")).toBeTruthy();
  });

  it("wires the form — submitting calls onAdd with the entered transaction", () => {
    const onAdd = vi.fn();
    render(
      <TransactionsTab
        month="2026-07"
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={onAdd}
        onDelete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "500" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ type: "income", amount: 500 }));
  });

  it("wires the list — clicking delete on a rendered row calls onDelete with that transaction's id", () => {
    const onDelete = vi.fn();
    const dayGroups: DayGroup[] = [
      {
        date: "2026-07-01",
        transactions: [{ id: "t1", type: "income", amount: 1000, date: "2026-07-01" }],
      },
    ];

    render(
      <TransactionsTab
        month="2026-07"
        totals={totals}
        dayGroups={dayGroups}
        categoryOptions={categoryOptions}
        onAdd={vi.fn()}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(onDelete).toHaveBeenCalledWith("t1");
  });

  it("shows the empty-state message from the list when there are no transactions", () => {
    render(
      <TransactionsTab
        month="2026-07"
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/no hay movimientos/i)).toBeTruthy();
  });
});

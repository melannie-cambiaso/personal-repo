import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionsTab } from "./TransactionsTab";
import type { DayGroup, ExpenseCategoryOption, TransactionTotals } from "@/features/finance-v2/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("TransactionsTab", () => {
  const totals: TransactionTotals = { income: 1000, expense: 400, savings: 200, balance: 600 };
  const categoryOptions: ExpenseCategoryOption[] = [];

  it("wires the summary — shows balance and savings from the given totals", () => {
    render(
      <TransactionsTab
        viewedMonth="2026-07"
        lastCrossMonthSave={null}
        onDismissCrossMonthSave={vi.fn()}
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
        viewedMonth="2026-07"
        lastCrossMonthSave={null}
        onDismissCrossMonthSave={vi.fn()}
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={onAdd}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Nuevo movimiento"));
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
        transactions: [
          { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
        ],
      },
    ];

    render(
      <TransactionsTab
        viewedMonth="2026-07"
        lastCrossMonthSave={null}
        onDismissCrossMonthSave={vi.fn()}
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
        viewedMonth="2026-07"
        lastCrossMonthSave={null}
        onDismissCrossMonthSave={vi.fn()}
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/no hay movimientos/i)).toBeTruthy();
  });

  it("shows no confirmation banner when lastCrossMonthSave is null", () => {
    render(
      <TransactionsTab
        viewedMonth="2026-07"
        lastCrossMonthSave={null}
        onDismissCrossMonthSave={vi.fn()}
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a dismissible confirmation banner naming the destination month when lastCrossMonthSave is set", () => {
    render(
      <TransactionsTab
        viewedMonth="2026-07"
        lastCrossMonthSave="2026-08"
        onDismissCrossMonthSave={vi.fn()}
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const banner = screen.getByRole("status");
    expect(banner.textContent).toMatch(/Guardado en/);
    expect(banner.textContent).toMatch(/agosto/i);
  });

  it("dismissing the banner calls onDismissCrossMonthSave", () => {
    const onDismissCrossMonthSave = vi.fn();
    render(
      <TransactionsTab
        viewedMonth="2026-07"
        lastCrossMonthSave="2026-08"
        onDismissCrossMonthSave={onDismissCrossMonthSave}
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("Cerrar aviso"));

    expect(onDismissCrossMonthSave).toHaveBeenCalledOnce();
  });
});

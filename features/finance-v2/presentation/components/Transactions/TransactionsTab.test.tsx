import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionsTab } from "./TransactionsTab";
import type { DayGroup, ExpenseCategoryOption, TransactionTotals } from "@/features/finance-v2/domain";
import { formatMonth } from "@/shared/utils/formatMonth";
import { prevMonth, nextMonth } from "@/shared/utils/monthUtils";

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
        onChangeMonth={vi.fn()}
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
        onChangeMonth={vi.fn()}
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
        onChangeMonth={vi.fn()}
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
        onChangeMonth={vi.fn()}
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
        onChangeMonth={vi.fn()}
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
        onChangeMonth={vi.fn()}
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
        onChangeMonth={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("Cerrar aviso"));

    expect(onDismissCrossMonthSave).toHaveBeenCalledOnce();
  });

  it("shows the month label formatted via formatMonth", () => {
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
        onChangeMonth={vi.fn()}
      />
    );

    expect(screen.getByText(formatMonth("2026-07"), { selector: "span" })).toBeTruthy();
  });

  it("clicking prev calls onChangeMonth with prevMonth(viewedMonth)", () => {
    const onChangeMonth = vi.fn();
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
        onChangeMonth={onChangeMonth}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "← Anterior" }));

    expect(onChangeMonth).toHaveBeenCalledWith(prevMonth("2026-07"));
  });

  it("clicking next calls onChangeMonth with nextMonth(viewedMonth)", () => {
    const onChangeMonth = vi.fn();
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
        onChangeMonth={onChangeMonth}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

    expect(onChangeMonth).toHaveBeenCalledWith(nextMonth("2026-07"));
  });

  it("disables prev/next once the Add-Transaction modal is open", () => {
    const onChangeMonth = vi.fn();
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
        onChangeMonth={onChangeMonth}
      />
    );

    expect((screen.getByRole("button", { name: "← Anterior" }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByText("Nuevo movimiento"));

    const prevButton = screen.getByRole("button", { name: "← Anterior" }) as HTMLButtonElement;
    const nextButton = screen.getByRole("button", { name: "Siguiente →" }) as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(true);

    fireEvent.click(prevButton);
    fireEvent.click(nextButton);

    expect(onChangeMonth).not.toHaveBeenCalled();
  });

  it("the Add-Transaction form's month select reseeds after a month change", () => {
    const { rerender } = render(
      <TransactionsTab
        viewedMonth="2026-07"
        lastCrossMonthSave={null}
        onDismissCrossMonthSave={vi.fn()}
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
        onChangeMonth={vi.fn()}
      />
    );

    rerender(
      <TransactionsTab
        viewedMonth="2026-09"
        lastCrossMonthSave={null}
        onDismissCrossMonthSave={vi.fn()}
        totals={totals}
        dayGroups={[]}
        categoryOptions={categoryOptions}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
        onChangeMonth={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Nuevo movimiento"));

    expect((screen.getByLabelText("Mes") as HTMLSelectElement).value).toBe("2026-09");
  });
});

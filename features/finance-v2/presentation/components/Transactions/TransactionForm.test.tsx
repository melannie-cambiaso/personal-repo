import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionForm } from "./TransactionForm";
import type { ExpenseCategoryOption, TransactionCategoryRef } from "@/features/finance-v2/domain";

const categoryOptions: ExpenseCategoryOption[] = [
  { id: "s1", name: "Luz", bucket: "fixed" },
  { id: "s2", name: "Ocio", bucket: "variable" },
];

const savingsCategoryOptions: TransactionCategoryRef[] = [
  { id: "sv1", name: "Viaje" },
  { id: "sv2", name: "Emergencia" },
];

describe("TransactionForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15)); // 2026-07-15, local time
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults the date input to today, with no min/max bound (date is unbounded)", () => {
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={vi.fn()}
      />
    );

    const dateInput = screen.getByLabelText("Fecha") as HTMLInputElement;
    expect(dateInput.value).toBe("2026-07-15");
    expect(dateInput.min).toBe("");
    expect(dateInput.max).toBe("");
  });

  it("offers exactly 7 month options, viewedMonth ± 3 months, defaulting to viewedMonth", () => {
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={vi.fn()}
      />
    );

    const monthSelect = screen.getByLabelText("Mes") as HTMLSelectElement;
    const optionValues = Array.from(monthSelect.options).map((o) => o.value);

    expect(optionValues).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(monthSelect.value).toBe("2026-07");
  });

  it("shows the bucket select for an expense with no subcategory chosen", () => {
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Bucket")).toBeTruthy();
  });

  it("HIDES the bucket select once a subcategory is chosen — bucket is inferred, not asked twice", () => {
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "s1" } });

    expect(screen.queryByLabelText("Bucket")).toBeNull();
  });

  it("re-shows the bucket select if the subcategory is cleared back to 'Sin subcategoría'", () => {
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "s1" } });
    expect(screen.queryByLabelText("Bucket")).toBeNull();

    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "" } });
    expect(screen.getByLabelText("Bucket")).toBeTruthy();
  });

  it("does not show subcategory or bucket controls for income/savings types", () => {
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });

    expect(screen.queryByLabelText("Subcategoría")).toBeNull();
    expect(screen.queryByLabelText("Bucket")).toBeNull();
  });

  it("submits an income transaction with the entered amount/date and resets the amount field", () => {
    const onAdd = vi.fn();
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={onAdd}
      />
    );

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "1000" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledWith({
      type: "income",
      amount: 1000,
      date: "2026-07-15",
      month: "2026-07",
      note: undefined,
    });
    expect((screen.getByLabelText("Monto") as HTMLInputElement).value).toBe("");
  });

  it("submits an expense linked to a subcategory with the inferred bucket and a snapshotted category ref", () => {
    const onAdd = vi.fn();
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={onAdd}
      />
    );

    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "5000" } });
    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "s2" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith({
      type: "expense",
      amount: 5000,
      date: "2026-07-15",
      month: "2026-07",
      note: undefined,
      bucket: "variable",
      category: { id: "s2", name: "Ocio" },
    });
  });

  it("submits a loose expense (no subcategory) using the manually chosen bucket", () => {
    const onAdd = vi.fn();
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={onAdd}
      />
    );

    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "300" } });
    fireEvent.change(screen.getByLabelText("Bucket"), { target: { value: "variable" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith({
      type: "expense",
      amount: 300,
      date: "2026-07-15",
      month: "2026-07",
      note: undefined,
      bucket: "variable",
      category: null,
    });
  });

  it("shows the category select for a savings transaction, populated from savings category options", () => {
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "savings" } });

    const select = screen.getByLabelText("Subcategoría") as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((o) => o.label);
    expect(optionLabels).toEqual(["Sin subcategoría", "Viaje", "Emergencia"]);
  });

  it("does not show the bucket select for a savings transaction", () => {
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "savings" } });

    expect(screen.queryByLabelText("Bucket")).toBeNull();
  });

  it("submits a savings transaction with category: null when 'Sin subcategoría' is selected", () => {
    const onAdd = vi.fn();
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={onAdd}
      />
    );

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "savings" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "1000" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith({
      type: "savings",
      amount: 1000,
      date: "2026-07-15",
      month: "2026-07",
      note: undefined,
      category: null,
    });
  });

  it("submits a savings transaction with the chosen category ref", () => {
    const onAdd = vi.fn();
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={onAdd}
      />
    );

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "savings" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "2000" } });
    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "sv2" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith({
      type: "savings",
      amount: 2000,
      date: "2026-07-15",
      month: "2026-07",
      note: undefined,
      category: { id: "sv2", name: "Emergencia" },
    });
  });

  it("does not submit when the amount is blank or zero", () => {
    const onAdd = vi.fn();
    render(
      <TransactionForm
        viewedMonth="2026-07"
        categoryOptions={categoryOptions}
        savingsCategoryOptions={savingsCategoryOptions}
        onAdd={onAdd}
      />
    );

    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).not.toHaveBeenCalled();
  });
});

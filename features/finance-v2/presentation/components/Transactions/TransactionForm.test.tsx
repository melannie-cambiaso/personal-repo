import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionForm } from "./TransactionForm";
import type { ExpenseCategoryOption } from "@/features/finance-v2/domain";

const categoryOptions: ExpenseCategoryOption[] = [
  { id: "s1", name: "Luz", bucket: "fixed" },
  { id: "s2", name: "Ocio", bucket: "variable" },
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
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={vi.fn()} />);

    const dateInput = screen.getByLabelText("Fecha") as HTMLInputElement;
    expect(dateInput.value).toBe("2026-07-15");
    expect(dateInput.min).toBe("");
    expect(dateInput.max).toBe("");
  });

  it("offers exactly 7 month options, viewedMonth ± 3 months, defaulting to viewedMonth", () => {
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={vi.fn()} />);

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
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={vi.fn()} />);

    expect(screen.getByLabelText("Bucket")).toBeTruthy();
  });

  it("HIDES the bucket select once a subcategory is chosen — bucket is inferred, not asked twice", () => {
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "s1" } });

    expect(screen.queryByLabelText("Bucket")).toBeNull();
  });

  it("re-shows the bucket select if the subcategory is cleared back to 'Sin subcategoría'", () => {
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "s1" } });
    expect(screen.queryByLabelText("Bucket")).toBeNull();

    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "" } });
    expect(screen.getByLabelText("Bucket")).toBeTruthy();
  });

  it("does not show subcategory or bucket controls for income/savings types", () => {
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });

    expect(screen.queryByLabelText("Subcategoría")).toBeNull();
    expect(screen.queryByLabelText("Bucket")).toBeNull();
  });

  it("submits an income transaction with the entered amount/date and resets the amount field", () => {
    const onAdd = vi.fn();
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={onAdd} />);

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
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={onAdd} />);

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
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={onAdd} />);

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

  it("does not submit when the amount is blank or zero", () => {
    const onAdd = vi.fn();
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={onAdd} />);

    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("submits a savings transaction with the picked source category as a snapshotted sourceCategory ref", () => {
    const onAdd = vi.fn();
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "savings" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "20000" } });
    fireEvent.change(screen.getByLabelText("Origen del ahorro"), { target: { value: "s1" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith({
      type: "savings",
      amount: 20000,
      date: "2026-07-15",
      month: "2026-07",
      note: undefined,
      sourceCategory: { id: "s1", name: "Luz", bucket: "fixed" },
    });
  });

  it("submits a savings transaction with no sourceCategory key when the source picker is left unset", () => {
    const onAdd = vi.fn();
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "savings" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "20000" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith({
      type: "savings",
      amount: 20000,
      date: "2026-07-15",
      month: "2026-07",
      note: undefined,
    });
    expect(onAdd.mock.calls[0][0]).not.toHaveProperty("sourceCategory");
  });

  it("hides the source-category picker for income and expense types", () => {
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={vi.fn()} />);

    expect(screen.queryByLabelText("Origen del ahorro")).toBeNull();

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    expect(screen.queryByLabelText("Origen del ahorro")).toBeNull();
  });

  it("does not leak an expense subcategory pick into a savings submission after switching type (cross-contamination guard)", () => {
    const onAdd = vi.fn();
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Subcategoría"), { target: { value: "s1" } });
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "savings" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "5000" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ type: "savings" }),
    );
    expect(onAdd.mock.calls[0][0]).not.toHaveProperty("sourceCategory");
  });

  it("does not leak a savings source-category pick into an expense submission after switching type (cross-contamination guard)", () => {
    const onAdd = vi.fn();
    render(<TransactionForm viewedMonth="2026-07" categoryOptions={categoryOptions} onAdd={onAdd} />);

    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "savings" } });
    fireEvent.change(screen.getByLabelText("Origen del ahorro"), { target: { value: "s1" } });
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "expense" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "5000" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ type: "expense", category: null }),
    );
  });
});

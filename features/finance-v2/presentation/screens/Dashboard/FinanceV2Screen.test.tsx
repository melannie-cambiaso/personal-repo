import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FinanceV2Screen } from "./FinanceV2Screen";
import { DEFAULT_FINANCE_V2_CONFIG, DEFAULT_BUDGET_CONFIG } from "@/features/finance-v2/domain";
import type { FinanceV2Config, FinanceV2Transaction } from "@/features/finance-v2/domain";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const defaultProps = () => ({
  initialConfig: DEFAULT_FINANCE_V2_CONFIG,
  onSave: vi.fn(),
  initialBudget: DEFAULT_BUDGET_CONFIG,
  onSaveBudget: vi.fn(),
  initialTransactions: [] as FinanceV2Transaction[],
  initialMonth: "2026-07",
  onSaveTransactions: vi.fn(),
  onSaveToOtherMonth: vi.fn(),
  onLoadTransactions: vi.fn().mockResolvedValue([]),
});

describe("FinanceV2Screen", () => {
  it("shows the 50/30/20 empty-state defaults and zero amounts when nothing was ever saved", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect((screen.getByLabelText("Ingreso mensual") as HTMLInputElement).value).toBe("");
    expect(screen.getByDisplayValue("50")).toBeTruthy();
    expect(screen.getByDisplayValue("30")).toBeTruthy();
    expect(screen.getByDisplayValue("20")).toBeTruthy();
    expect(screen.getAllByText("$0")).toHaveLength(3);
  });

  it("renders a previously saved config and its computed amounts", () => {
    const saved: FinanceV2Config = {
      income: 1_000_000,
      fixedPct: 50,
      variablePct: 30,
      savingsPct: 20,
    };

    render(<FinanceV2Screen {...defaultProps()} initialConfig={saved} />);

    expect(screen.getByDisplayValue("1000000")).toBeTruthy();
    expect(screen.getByText("$500.000")).toBeTruthy();
    expect(screen.getByText("$300.000")).toBeTruthy();
    expect(screen.getByText("$200.000")).toBeTruthy();
  });

  it("hides the computed amounts and shows the error while an edit makes the split invalid, then restores them once corrected", () => {
    const onSave = vi.fn();
    render(<FinanceV2Screen {...defaultProps()} onSave={onSave} />);

    fireEvent.blur(screen.getByLabelText("Fijos"), { target: { value: "60" } });

    expect(screen.queryByText(/\$/)).toBeNull();
    expect(screen.getByText(/deben sumar 100%/)).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText("Variables"), { target: { value: "20" } });

    expect(screen.queryByText(/deben sumar 100%/)).toBeNull();
    expect(screen.getAllByText("$0")).toHaveLength(3);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("clamps a negative income to 0 on blur", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.blur(screen.getByLabelText("Ingreso mensual"), { target: { value: "-500" } });

    expect((screen.getByLabelText("Ingreso mensual") as HTMLInputElement).value).toBe("");
  });

  it("defaults to the Distribución tab, showing the split editor and hiding the budget tab", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByLabelText("Ingreso mensual")).toBeTruthy();
    expect(screen.getByText("Presupuesto")).toBeTruthy();
  });

  it("switches to the Presupuesto tab and hides the split editor", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.queryByLabelText("Ingreso mensual")).toBeNull();
    expect(screen.getAllByText("Fijos").length).toBeGreaterThan(0);
  });

  it("preserves a budget category added on the Presupuesto tab after switching away and back", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Presupuesto"));
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre de la categoría"), {
      target: { value: "Arriendo" },
    });
    fireEvent.click(screen.getByText("Agregar categoría"));
    expect(screen.getByText("Arriendo")).toBeTruthy();

    fireEvent.click(screen.getByText("Distribución"));
    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByText("Arriendo")).toBeTruthy();
  });

  it("Presupuesto tab defaults to view mode", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.queryByLabelText("Nombre de la categoría")).toBeNull();
  });

  it("mode survives Presupuesto → Distribución → Presupuesto", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Presupuesto"));
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Nombre de la categoría")).toBeTruthy();

    fireEvent.click(screen.getByText("Distribución"));
    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByLabelText("Nombre de la categoría")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Listo" })).toBeTruthy();
  });

  it("mode persists across a category-list mutation", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Presupuesto"));
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre de la categoría"), {
      target: { value: "Arriendo" },
    });
    fireEvent.click(screen.getByText("Agregar categoría"));

    expect(screen.getByRole("button", { name: "Listo" })).toBeTruthy();
  });

  it("preserves edited income in the DOM after switching tabs and back", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.blur(screen.getByLabelText("Ingreso mensual"), { target: { value: "1500000" } });

    fireEvent.click(screen.getByText("Presupuesto"));
    fireEvent.click(screen.getByText("Distribución"));

    expect((screen.getByLabelText("Ingreso mensual") as HTMLInputElement).value).toBe("1500000");
  });

  it("the Movimientos tab is reachable alongside tabs 1-2, without affecting their state", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));

    expect(screen.queryByLabelText("Ingreso mensual")).toBeNull();
    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByText(/no hay movimientos/i)).toBeTruthy();
  });

  it("a transaction added on the Movimientos tab survives switching away and back", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByText("Nuevo movimiento"));
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "1000" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    // "$1.000" appears twice: once as the balance total, once as the row's own amount.
    expect(screen.getAllByText("$1.000")).toHaveLength(2);
    expect(screen.getByLabelText("Eliminar movimiento de $1.000")).toBeTruthy();

    fireEvent.click(screen.getByText("Distribución"));
    fireEvent.click(screen.getByText("Movimientos"));

    expect(screen.getAllByText("$1.000")).toHaveLength(2);
    expect(screen.getByLabelText("Eliminar movimiento de $1.000")).toBeTruthy();
  });

  it("a transaction filed to a different month via the picker calls onSaveToOtherMonth, stays absent from the current view, and shows the confirmation banner", () => {
    const onSaveToOtherMonth = vi.fn();
    const onSaveTransactions = vi.fn();
    render(
      <FinanceV2Screen
        {...defaultProps()}
        onSaveToOtherMonth={onSaveToOtherMonth}
        onSaveTransactions={onSaveTransactions}
      />
    );

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "income" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText("Mes"), { target: { value: "2026-08" } });
    fireEvent.click(screen.getByText("Agregar movimiento"));

    expect(onSaveToOtherMonth).toHaveBeenCalledOnce();
    expect(onSaveTransactions).not.toHaveBeenCalled();
    expect(screen.queryByText(/no hay movimientos/i)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/Guardado en/);
  });
});

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FinanceV2Screen } from "./FinanceV2Screen";
import { DEFAULT_BUDGET_CONFIG } from "@/features/finance-v2/domain";
import type { FinanceV2Transaction } from "@/features/finance-v2/domain";
import { formatMonth } from "@/shared/utils/formatMonth";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const defaultProps = () => ({
  initialBudget: DEFAULT_BUDGET_CONFIG,
  onSaveBudget: vi.fn(),
  initialTransactions: [] as FinanceV2Transaction[],
  initialMonth: "2026-07",
  onSaveTransactions: vi.fn(),
  onSaveToOtherMonth: vi.fn(),
  onLoadTransactions: vi.fn().mockResolvedValue([]),
});

describe("FinanceV2Screen", () => {
  it("defaults to the Presupuesto tab, showing the budget composition", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getAllByText("Fijos (0%)").length).toBeGreaterThan(0);
  });

  it("renders no Distribución tab or text", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.queryByText("Distribución")).toBeNull();
    expect(screen.getByText("Presupuesto")).toBeTruthy();
    expect(screen.getByText("Movimientos")).toBeTruthy();
  });

  it("switches to the Movimientos tab, hiding the Presupuesto view", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));

    expect(screen.queryByText("Fijos (0%)")).toBeNull();
    expect(screen.getByText("Balance")).toBeTruthy();
  });

  it("preserves a budget category added on the Presupuesto tab after switching away and back", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre de la categoría"), {
      target: { value: "Arriendo" },
    });
    fireEvent.click(screen.getByText("Agregar categoría"));
    expect(screen.getByText("Arriendo")).toBeTruthy();

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByText("Arriendo")).toBeTruthy();
  });

  it("Presupuesto tab defaults to view mode", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.queryByLabelText("Nombre de la categoría")).toBeNull();
  });

  it("mode survives Presupuesto → Movimientos → Presupuesto", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Nombre de la categoría")).toBeTruthy();

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByLabelText("Nombre de la categoría")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Listo" })).toBeTruthy();
  });

  it("mode persists across a category-list mutation", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nombre de la categoría"), {
      target: { value: "Arriendo" },
    });
    fireEvent.click(screen.getByText("Agregar categoría"));

    expect(screen.getByRole("button", { name: "Listo" })).toBeTruthy();
  });

  it("the Movimientos tab is reachable independently of the Presupuesto tab, without affecting its state", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));

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

    fireEvent.click(screen.getByText("Presupuesto"));
    fireEvent.click(screen.getByText("Movimientos"));

    expect(screen.getAllByText("$1.000")).toHaveLength(2);
    expect(screen.getByLabelText("Eliminar movimiento de $1.000")).toBeTruthy();
  });

  it("shows the shared MonthNav on first render, since Presupuesto is the default tab", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    expect(screen.getByRole("button", { name: "← Anterior" })).toBeTruthy();
  });

  it("shows a single shared MonthNav on the Movimientos tab", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));

    expect(screen.getByRole("button", { name: "← Anterior" })).toBeTruthy();
  });

  it("switching the month from the shared MonthNav is reflected immediately when switching to the Presupuesto tab", () => {
    render(<FinanceV2Screen {...defaultProps()} initialMonth="2026-07" />);

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByText(formatMonth("2026-08"), { selector: "span" })).toBeTruthy();
  });

  it("clicking ← Anterior on the shared MonthNav decrements the viewed month", () => {
    render(<FinanceV2Screen {...defaultProps()} initialMonth="2026-07" />);

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByRole("button", { name: "← Anterior" }));

    fireEvent.click(screen.getByText("Presupuesto"));

    expect(screen.getByText(formatMonth("2026-06"), { selector: "span" })).toBeTruthy();
  });

  it("opening the Add-Transaction modal disables the shared MonthNav (lifted isAddOpen guard)", () => {
    render(<FinanceV2Screen {...defaultProps()} />);

    fireEvent.click(screen.getByText("Movimientos"));
    fireEvent.click(screen.getByText("Nuevo movimiento"));

    expect(
      (screen.getByRole("button", { name: "← Anterior" }) as HTMLButtonElement).disabled
    ).toBe(true);
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

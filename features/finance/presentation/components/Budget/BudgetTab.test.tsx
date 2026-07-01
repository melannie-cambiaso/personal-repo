import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SummaryCard, BudgetTab } from "./BudgetTab";

vi.mock("@/features/finance/data/financeActions", () => ({
  getBudgetForMonth: vi.fn().mockResolvedValue({}),
}));

// Task 1.1 — spec: Scenario: Under budget
describe("SummaryCard — pending row", () => {
  it("renders 'Pendiente $50' when pendingAmount is 50", () => {
    render(<SummaryCard label="Gastos" budget={1000} actual={950} pendingAmount={50} />);
    expect(screen.getByText("Pendiente $50")).toBeTruthy();
  });

  // Task 1.2 — spec: Scenario: Exactly on budget
  it("renders 'Pendiente $0' (row visible) when pendingAmount is 0", () => {
    render(<SummaryCard label="Gastos" budget={1000} actual={1000} pendingAmount={0} />);
    expect(screen.getByText("Pendiente $0")).toBeTruthy();
  });

  // Task 1.3 — spec: Scenario: Over budget; uses Math.abs on pendingAmount=-30
  it("renders 'Excedido $30' when pendingAmount is -30 (absolute value)", () => {
    render(<SummaryCard label="Gastos" budget={1000} actual={1030} pendingAmount={-30} />);
    expect(screen.getByText("Excedido $30")).toBeTruthy();
  });

  // Task 1.4 — spec: Ingresos/Neto Scenario — no third row without pendingAmount
  it("renders no pending/excedido row when pendingAmount is not provided", () => {
    render(<SummaryCard label="Ingresos" budget={2000} actual={1800} />);
    expect(screen.queryByText(/Pendiente/)).toBeNull();
    expect(screen.queryByText(/Excedido/)).toBeNull();
  });
});

describe("BudgetTab — refund group separation", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onOpenTransaction = vi.fn();

  // T2 — satisfies: Devoluciones GroupSection requirement
  it("renders Devoluciones section heading and Isapre category when a refund group is provided", () => {
    const groups = [{ name: "Devolución", type: "refund" as const, categories: ["Isapre"] }];
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{}}
        transactions={[]}
        selectedMonth="2025-01"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    expect(screen.getByRole("heading", { name: "Devoluciones" })).toBeTruthy();
    expect(screen.getByText("Isapre")).toBeTruthy();
  });

  // T3 — satisfies: Filter isolation scenario
  it("renders Ingresos, Devoluciones, and Gastos sections simultaneously; income and refund categories each render in their own section", () => {
    const groups = [
      { name: "Sueldo", type: "income" as const, categories: ["Peter"] },
      { name: "Devolución", type: "refund" as const, categories: ["Isapre"] },
      { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo"] },
    ];
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{}}
        transactions={[]}
        selectedMonth="2025-01"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    expect(screen.getByRole("heading", { name: "Ingresos" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Devoluciones" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Gastos" })).toBeTruthy();
    expect(screen.getByText("Peter")).toBeTruthy();
    expect(screen.getByText("Isapre")).toBeTruthy();
    expect(screen.getByText("Arriendo")).toBeTruthy();
  });

  // T4 — satisfies: Neto Excludes Refunds + Devoluciones SummaryCard
  it("Neto excludes refunds: income=1000000, refund=100000, expense=600000 → Neto=$400.000", () => {
    const groups = [
      { name: "Sueldo", type: "income" as const, categories: ["Peter"] },
      { name: "Devolución", type: "refund" as const, categories: ["Isapre"] },
      { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo"] },
    ];
    const initialBudget = { Peter: 1000000, Isapre: 100000, Arriendo: 600000 };
    render(
      <BudgetTab
        groups={groups}
        initialBudget={initialBudget}
        transactions={[]}
        selectedMonth="2025-01"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    // Devoluciones GroupSection must be present (RED until implemented)
    expect(screen.getByRole("heading", { name: "Devoluciones" })).toBeTruthy();
    // Neto = income − expense only; refund amounts must not inflate income
    const netoLabel = screen.getByText("Neto");
    const netoCard = netoLabel.closest("div")!;
    expect(within(netoCard).getByText(/\$400\.000/)).toBeTruthy();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { SummaryCard, BudgetTab } from "./BudgetTab";
import type { FinanceTransaction } from "@/features/finance/domain";

const toggleClosedCategoryMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/features/finance/data/financeActions", () => ({
  getBudgetForMonth: vi.fn().mockResolvedValue({}),
  toggleClosedCategory: toggleClosedCategoryMock,
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

describe("SummaryCard – disponible/ahorroPotencial props", () => {
  // A1 — disponible positive: label "Disponible", green
  it("A1: renders 'Disponible $600.000' when disponible=600000", () => {
    render(<SummaryCard label="Neto" budget={0} actual={0} disponible={600000} />);
    expect(screen.getByText("Disponible $600.000")).toBeTruthy();
  });

  // A2 — disponible negative: label "Faltante", absolute value, red
  it("A2: renders 'Faltante $200.000' when disponible=-200000", () => {
    render(<SummaryCard label="Neto" budget={0} actual={0} disponible={-200000} />);
    expect(screen.getByText("Faltante $200.000")).toBeTruthy();
  });

  // A3 — disponible zero (boundary): label "Disponible", green
  it("A3: renders 'Disponible $0' when disponible=0 (break-even boundary)", () => {
    render(<SummaryCard label="Neto" budget={0} actual={0} disponible={0} />);
    expect(screen.getByText("Disponible $0")).toBeTruthy();
  });

  // A4 — ahorroPotencial positive
  it("A4: renders 'Ahorro potencial $700.000' when ahorroPotencial=700000", () => {
    render(<SummaryCard label="Neto" budget={0} actual={0} ahorroPotencial={700000} />);
    expect(screen.getByText("Ahorro potencial $700.000")).toBeTruthy();
  });

  // A5 — ahorroPotencial negative: absolute value, red (Math.abs)
  it("A5: renders 'Ahorro potencial $50.000' when ahorroPotencial=-50000", () => {
    render(<SummaryCard label="Neto" budget={0} actual={0} ahorroPotencial={-50000} />);
    expect(screen.getByText("Ahorro potencial $50.000")).toBeTruthy();
  });

  // A6 — absent props: no secondary metric rows rendered
  it("A6: renders no 'Disponible', 'Faltante', or 'Ahorro potencial' when props absent", () => {
    render(<SummaryCard label="Neto" budget={0} actual={0} />);
    expect(screen.queryByText(/Disponible/)).toBeNull();
    expect(screen.queryByText(/Faltante/)).toBeNull();
    expect(screen.queryByText(/Ahorro potencial/)).toBeNull();
  });

  // A7 — coexistence: pendingAmount and disponible both rendered independently
  it("A7: renders both 'Pendiente $50' and 'Disponible $200' when both props provided", () => {
    render(
      <SummaryCard label="Gastos" budget={1000} actual={900} pendingAmount={50} disponible={200} />
    );
    expect(screen.getByText("Pendiente $50")).toBeTruthy();
    expect(screen.getByText("Disponible $200")).toBeTruthy();
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

describe("BudgetTab – disponible/ahorroPotencial integration", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onOpenTransaction = vi.fn();

  const baseGroups = [
    { name: "Sueldo", type: "income" as const, categories: ["Peter"] },
    { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo"] },
  ];

  function makeTx(category: string, amount: number): FinanceTransaction {
    return { id: crypto.randomUUID(), category, amount, createdAt: "2025-01-01T00:00:00Z" };
  }

  // B1 — disponible positive: actualIncome=1000000, pendingExpenses=400000 → disponible=600000
  it("B1: renders 'Disponible $600.000' inside Neto card", () => {
    render(
      <BudgetTab
        groups={baseGroups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[makeTx("Peter", 1000000)]}
        selectedMonth="2025-01"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    const netoCard = screen.getByText("Neto").closest("div")!;
    expect(within(netoCard).getByText("Disponible $600.000")).toBeTruthy();
  });

  // B2 — disponible negative: actualIncome=200000, pendingExpenses=600000 → disponible=-400000
  it("B2: renders 'Faltante $400.000' inside Neto card when income < pending", () => {
    render(
      <BudgetTab
        groups={baseGroups}
        initialBudget={{ Arriendo: 600000 }}
        transactions={[makeTx("Peter", 200000)]}
        selectedMonth="2025-01"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    const netoCard = screen.getByText("Neto").closest("div")!;
    expect(within(netoCard).getByText("Faltante $400.000")).toBeTruthy();
  });

  // B3 — ahorroPotencial: actualIncome=1000000, actualRefund=100000, pendingExpenses=400000 → 700000
  it("B3: renders 'Ahorro potencial $700.000' inside Neto card", () => {
    const groups = [
      { name: "Sueldo", type: "income" as const, categories: ["Peter"] },
      { name: "Devolución", type: "refund" as const, categories: ["Isapre"] },
      { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo"] },
    ];
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[makeTx("Peter", 1000000), makeTx("Isapre", 100000)]}
        selectedMonth="2025-01"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    const netoCard = screen.getByText("Neto").closest("div")!;
    expect(within(netoCard).getByText("Ahorro potencial $700.000")).toBeTruthy();
  });

  // B4 — Ingresos card must NOT show Disponible or Ahorro potencial
  it("B4: Ingresos card does not render 'Disponible' or 'Ahorro potencial'", () => {
    render(
      <BudgetTab
        groups={baseGroups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[makeTx("Peter", 1000000)]}
        selectedMonth="2025-01"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    const ingresosCard = screen.getAllByText("Ingresos")[0].closest("div")!;
    expect(within(ingresosCard).queryByText(/Disponible/)).toBeNull();
    expect(within(ingresosCard).queryByText(/Ahorro potencial/)).toBeNull();
  });

  // B5 — Gastos card must NOT show Disponible or Ahorro potencial
  it("B5: Gastos card does not render 'Disponible' or 'Ahorro potencial'", () => {
    render(
      <BudgetTab
        groups={baseGroups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[makeTx("Peter", 1000000)]}
        selectedMonth="2025-01"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    const gastosCard = screen.getAllByText("Gastos")[0].closest("div")!;
    expect(within(gastosCard).queryByText(/Disponible/)).toBeNull();
    expect(within(gastosCard).queryByText(/Ahorro potencial/)).toBeNull();
  });
});

describe("BudgetTab — closed expense categories", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onOpenTransaction = vi.fn();

  const expenseGroups = [
    { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo"] },
  ];
  const incomeGroups = [{ name: "Sueldo", type: "income" as const, categories: ["Peter"] }];

  it("toggle button is present on expense rows and closes an open category on click", () => {
    render(
      <BudgetTab
        groups={expenseGroups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-06"
        initialClosedCategories={[]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    const toggleButton = screen.getByRole("button", { name: "Cerrar Arriendo" });
    expect(toggleButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggleButton);

    expect(toggleClosedCategoryMock).toHaveBeenCalledWith("2026-06", "Arriendo");
    expect(screen.getByRole("button", { name: "Reabrir Arriendo" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
  });

  it("toggle reopens an already-closed category on click", () => {
    render(
      <BudgetTab
        groups={expenseGroups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-06"
        initialClosedCategories={["Arriendo"]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    const toggleButton = screen.getByRole("button", { name: "Reabrir Arriendo" });

    fireEvent.click(toggleButton);

    expect(toggleClosedCategoryMock).toHaveBeenCalledWith("2026-06", "Arriendo");
    expect(screen.getByRole("button", { name: "Cerrar Arriendo" }).getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  it("a closed row marks itself aria-disabled and disables the budget input", () => {
    render(
      <BudgetTab
        groups={expenseGroups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-06"
        initialClosedCategories={["Arriendo"]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    const categoryName = screen.getByText("Arriendo");
    const row = categoryName.closest("[aria-disabled]");
    expect(row?.getAttribute("aria-disabled")).toBe("true");
    const budgetInput = within(row as HTMLElement).getByPlaceholderText("0") as HTMLInputElement;
    expect(budgetInput.disabled).toBe(true);
  });

  it("an open row is not aria-disabled and its budget input is enabled", () => {
    render(
      <BudgetTab
        groups={expenseGroups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-06"
        initialClosedCategories={[]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    const categoryName = screen.getByText("Arriendo");
    const row = categoryName.closest("[aria-disabled]");
    expect(row?.getAttribute("aria-disabled")).toBe("false");
    const budgetInput = within(row as HTMLElement).getByPlaceholderText("0") as HTMLInputElement;
    expect(budgetInput.disabled).toBe(false);
  });

  it("does not render the close toggle button on income rows", () => {
    render(
      <BudgetTab
        groups={incomeGroups}
        initialBudget={{ Peter: 1000000 }}
        transactions={[]}
        selectedMonth="2026-06"
        initialClosedCategories={[]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
      />
    );
    expect(screen.queryByRole("button", { name: /Cerrar|Reabrir/ })).toBeNull();
  });
});

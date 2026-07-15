import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { SummaryCard, BudgetTab } from "./BudgetTab";
import type { FinanceTransaction } from "@/features/finance/domain";

const toggleClosedCategoryMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const toggleExcludedCategoryMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const getBudgetForMonthMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const getBudgetUnitConfigForMonthMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const saveCategoryNoteMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/features/finance/data/financeActions", () => ({
  getBudgetForMonth: getBudgetForMonthMock,
  getBudgetUnitConfigForMonth: getBudgetUnitConfigForMonthMock,
  toggleClosedCategory: toggleClosedCategoryMock,
  toggleExcludedCategory: toggleExcludedCategoryMock,
  saveCategoryNote: saveCategoryNoteMock,
}));

// jsdom does not implement HTMLDialogElement.showModal / close (used by BudgetCategoriesModal)
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

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
  const onSaveUnitConfig = vi.fn().mockResolvedValue(undefined);
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    expect(within(tableView).getByRole("heading", { name: "Devoluciones" })).toBeTruthy();
    expect(within(tableView).getByText("Isapre")).toBeTruthy();
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    expect(within(tableView).getByRole("heading", { name: "Ingresos" })).toBeTruthy();
    expect(within(tableView).getByRole("heading", { name: "Devoluciones" })).toBeTruthy();
    expect(within(tableView).getByRole("heading", { name: "Gastos" })).toBeTruthy();
    expect(within(tableView).getByText("Peter")).toBeTruthy();
    expect(within(tableView).getByText("Isapre")).toBeTruthy();
    expect(within(tableView).getByText("Arriendo")).toBeTruthy();
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    // Devoluciones view must be present (scoped to the unchanged table view)
    const tableView = screen.getByTestId("budget-table");
    expect(within(tableView).getByRole("heading", { name: "Devoluciones" })).toBeTruthy();
    // Neto = income − expense only; refund amounts must not inflate income
    const netoLabel = screen.getByText("Neto");
    const netoCard = netoLabel.closest("div")!;
    expect(within(netoCard).getByText(/\$400\.000/)).toBeTruthy();
  });
});

describe("BudgetTab — responsive view split (mobile cards / desktop table)", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onSaveUnitConfig = vi.fn().mockResolvedValue(undefined);
  const onOpenTransaction = vi.fn();

  const groups = [
    { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo"] },
  ];

  // 2.1 — satisfies: responsive-layout / BudgetTab mobile card layout — both views render
  it("renders both a budget-table container and a budget-cards container", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-06"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    expect(screen.getByTestId("budget-table")).toBeTruthy();
    expect(screen.getByTestId("budget-cards")).toBeTruthy();
  });

  // 2.1/2.3 — satisfies: No information loss on mobile — same category data present in cards view
  it("cards view renders the same category name, budget, real, and diff values as the table view", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-06"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const cardsView = screen.getByTestId("budget-cards");

    expect(within(tableView).getByText("Arriendo")).toBeTruthy();
    expect(within(cardsView).getByText("Arriendo")).toBeTruthy();

    // both views show the same "no actual spend yet" placeholder for Real
    expect(within(tableView).getByText("—")).toBeTruthy();
    expect(within(cardsView).getByText("—")).toBeTruthy();

    // both views expose a budget input pre-filled with the same planned amount
    const tableInput = within(tableView).getByPlaceholderText("0") as HTMLInputElement;
    const cardsInput = within(cardsView).getByPlaceholderText("0") as HTMLInputElement;
    expect(tableInput.value).toBe("400000");
    expect(cardsInput.value).toBe("400000");
  });

  // 2.1/2.3 — satisfies: shared computed model — toggling in one view is reflected consistently
  it("closing a category via the cards view toggle calls the same handler as the table view", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-06"
        initialClosedCategories={[]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const cardsView = screen.getByTestId("budget-cards");
    const toggleButton = within(cardsView).getByRole("button", { name: "Cerrar Arriendo" });
    expect(toggleButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggleButton);

    expect(toggleClosedCategoryMock).toHaveBeenCalledWith("2026-06", "Arriendo");
    // the table view (same shared state) reflects the change too
    const tableView = screen.getByTestId("budget-table");
    expect(
      within(tableView).getByRole("button", { name: "Reabrir Arriendo" }).getAttribute("aria-pressed")
    ).toBe("true");
  });
});

describe("BudgetTab – disponible/ahorroPotencial integration", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onSaveUnitConfig = vi.fn().mockResolvedValue(undefined);
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
        onSaveUnitConfig={onSaveUnitConfig}
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const netoCard = screen.getByText("Neto").closest("div")!;
    expect(within(netoCard).getByText("Faltante $400.000")).toBeTruthy();
  });

  // B3 — real refunds move Disponible; Ahorro potencial becomes the still-expected gap;
  // Neto "Real" shows realBalance (v3):
  // actualIncome=1000000, actualExpense=0, actualRefund=100000, budgetRefund=0, pendingExpenses=400000
  // → realBalance=1100000 ("Real"), available=700000 ("Disponible"), potentialSavings=-100000 ("Ahorro potencial")
  it("B3: renders 'Real $1.100.000', 'Disponible $700.000' and 'Ahorro potencial $100.000' inside Neto card", () => {
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const netoCard = screen.getByText("Neto").closest("div")!;
    expect(within(netoCard).getByText("Real $1.100.000")).toBeTruthy();
    expect(within(netoCard).getByText("Disponible $700.000")).toBeTruthy();
    expect(within(netoCard).getByText("Ahorro potencial $100.000")).toBeTruthy();
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
        onSaveUnitConfig={onSaveUnitConfig}
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const gastosCard = screen.getAllByText("Gastos")[0].closest("div")!;
    expect(within(gastosCard).queryByText(/Disponible/)).toBeNull();
    expect(within(gastosCard).queryByText(/Ahorro potencial/)).toBeNull();
  });
});

describe("BudgetTab — closed expense categories", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onSaveUnitConfig = vi.fn().mockResolvedValue(undefined);
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const toggleButton = within(tableView).getByRole("button", { name: "Cerrar Arriendo" });
    expect(toggleButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(toggleButton);

    expect(toggleClosedCategoryMock).toHaveBeenCalledWith("2026-06", "Arriendo");
    expect(
      within(tableView).getByRole("button", { name: "Reabrir Arriendo" }).getAttribute("aria-pressed")
    ).toBe("true");
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const toggleButton = within(tableView).getByRole("button", { name: "Reabrir Arriendo" });

    fireEvent.click(toggleButton);

    expect(toggleClosedCategoryMock).toHaveBeenCalledWith("2026-06", "Arriendo");
    expect(
      within(tableView).getByRole("button", { name: "Cerrar Arriendo" }).getAttribute("aria-pressed")
    ).toBe("false");
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const categoryName = within(tableView).getByText("Arriendo");
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
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const categoryName = within(tableView).getByText("Arriendo");
    const row = categoryName.closest("[aria-disabled]");
    expect(row?.getAttribute("aria-disabled")).toBe("false");
    const budgetInput = within(row as HTMLElement).getByPlaceholderText("0") as HTMLInputElement;
    expect(budgetInput.disabled).toBe(false);
  });

  it("does not render the close toggle button on income rows, in either view", () => {
    render(
      <BudgetTab
        groups={incomeGroups}
        initialBudget={{ Peter: 1000000 }}
        transactions={[]}
        selectedMonth="2026-06"
        initialClosedCategories={[]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const cardsView = screen.getByTestId("budget-cards");
    expect(within(tableView).queryByRole("button", { name: /Cerrar|Reabrir/ })).toBeNull();
    expect(within(cardsView).queryByRole("button", { name: /Cerrar|Reabrir/ })).toBeNull();
  });
});

describe("BudgetTab — excluded expense categories", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onSaveUnitConfig = vi.fn().mockResolvedValue(undefined);
  const onOpenTransaction = vi.fn();

  it("does not render an excluded category's row in the table or cards view", () => {
    const groups = [
      { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo", "Suscripciones"] },
    ];
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Arriendo: 400000, Suscripciones: 15000 }}
        transactions={[]}
        selectedMonth="2026-07"
        initialExcludedCategories={["Suscripciones"]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const cardsView = screen.getByTestId("budget-cards");
    expect(within(tableView).queryByText("Suscripciones")).toBeNull();
    expect(within(cardsView).queryByText("Suscripciones")).toBeNull();
    expect(within(tableView).getByText("Arriendo")).toBeTruthy();
  });

  it("excludes an excluded category's amounts from budget/actual totals and pending", () => {
    const groups = [
      { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo", "Suscripciones"] },
    ];
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Arriendo: 100000, Suscripciones: 15000 }}
        transactions={[]}
        selectedMonth="2026-07"
        initialExcludedCategories={["Suscripciones"]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const gastosCard = screen.getAllByText("Gastos")[0].closest("div")!;
    // total budget shown should be 100000 (Suscripciones' 15000 excluded)
    expect(within(gastosCard).getByText("Presup. $100.000")).toBeTruthy();
  });

  it("a category both closed and excluded does not render (excluded wins)", () => {
    const groups = [
      { name: "Gastos fijos", type: "expense" as const, categories: ["Gimnasio"] },
    ];
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Gimnasio: 20000 }}
        transactions={[]}
        selectedMonth="2026-07"
        initialClosedCategories={["Gimnasio"]}
        initialExcludedCategories={["Gimnasio"]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const cardsView = screen.getByTestId("budget-cards");
    expect(within(tableView).queryByText("Gimnasio")).toBeNull();
    expect(within(cardsView).queryByText("Gimnasio")).toBeNull();
  });

  it("an income category with the same name as an excluded expense category still renders", () => {
    const groups = [
      { name: "Sueldo", type: "income" as const, categories: ["Suscripciones"] },
      { name: "Gastos fijos", type: "expense" as const, categories: ["Suscripciones"] },
    ];
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{}}
        transactions={[]}
        selectedMonth="2026-07"
        initialExcludedCategories={["Suscripciones"]}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const incomeGroups = within(tableView).getAllByText("Suscripciones");
    // Only the income row should remain (expense one filtered out)
    expect(incomeGroups).toHaveLength(1);
  });
});

describe("BudgetTab — category notes", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onSaveUnitConfig = vi.fn().mockResolvedValue(undefined);
  const onOpenTransaction = vi.fn();

  const groups = [
    { name: "Gastos fijos", type: "expense" as const, categories: ["Suscripciones", "Arriendo"] },
  ];

  beforeEach(() => {
    saveCategoryNoteMock.mockClear();
  });

  it("shows a note indicator on a category with a saved note, in both table and card views", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Suscripciones: 15000, Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-07"
        initialCategoryNotes={{ Suscripciones: "Netflix + Spotify" }}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const cardsView = screen.getByTestId("budget-cards");
    expect(within(tableView).getByTestId("note-indicator-Suscripciones")).toBeTruthy();
    expect(within(cardsView).getByTestId("note-indicator-Suscripciones")).toBeTruthy();
  });

  it("does not show a note indicator when no note exists for a category", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Suscripciones: 15000, Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-07"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    expect(within(tableView).queryByTestId("note-indicator-Arriendo")).toBeNull();
  });

  it("expanding a category's name cell and saving non-empty text calls saveCategoryNote and shows the indicator", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Suscripciones: 15000, Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-07"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    fireEvent.click(within(tableView).getByRole("button", { name: /Agregar nota a Arriendo/ }));

    const textarea = within(tableView).getByPlaceholderText("Agregar nota...");
    fireEvent.blur(textarea, { target: { value: "Depto + estacionamiento" } });

    expect(saveCategoryNoteMock).toHaveBeenCalledWith(
      "2026-07",
      "Arriendo",
      "Depto + estacionamiento"
    );
    expect(within(tableView).getByTestId("note-indicator-Arriendo")).toBeTruthy();
  });

  it("saving empty text removes the note indicator", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Suscripciones: 15000, Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-07"
        initialCategoryNotes={{ Arriendo: "Depto" }}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    fireEvent.click(within(tableView).getByRole("button", { name: /Ver nota de Arriendo/ }));

    const textarea = within(tableView).getByPlaceholderText("Agregar nota...");
    fireEvent.blur(textarea, { target: { value: "" } });

    expect(saveCategoryNoteMock).toHaveBeenCalledWith("2026-07", "Arriendo", "");
    expect(within(tableView).queryByTestId("note-indicator-Arriendo")).toBeNull();
  });

  it("does not render note affordance on income category rows", () => {
    const incomeGroups = [{ name: "Sueldo", type: "income" as const, categories: ["Peter"] }];
    render(
      <BudgetTab
        groups={incomeGroups}
        initialBudget={{ Peter: 1000000 }}
        transactions={[]}
        selectedMonth="2026-07"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    expect(
      screen.queryByRole("button", { name: /Agregar nota a Peter|Ver nota de Peter/ })
    ).toBeNull();
  });

  it("does not add extra grid columns to the desktop row when a note indicator is present (mobile-overflow regression guard)", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Suscripciones: 15000, Arriendo: 400000 }}
        transactions={[]}
        selectedMonth="2026-07"
        initialCategoryNotes={{ Suscripciones: "Netflix" }}
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    const tableView = screen.getByTestId("budget-table");
    const row = within(tableView).getByText("Suscripciones").closest("[aria-disabled]") as HTMLElement;
    expect(row.className).toContain("grid-cols-4");
    expect(row.children).toHaveLength(4);
  });
});

describe("BudgetTab — BudgetCategoriesModal launch and toggle wiring", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onSaveUnitConfig = vi.fn().mockResolvedValue(undefined);
  const onOpenTransaction = vi.fn();

  const groups = [
    { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo", "Suscripciones"] },
  ];

  it("toolbar has a button that opens BudgetCategoriesModal", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Arriendo: 400000, Suscripciones: 15000 }}
        transactions={[]}
        selectedMonth="2026-07"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Categorías/ }));
    expect(screen.getByText(/Categorías del presupuesto/)).toBeTruthy();
  });

  it("toggling a category in the modal updates excludedCategories live and calls toggleExcludedCategory", () => {
    render(
      <BudgetTab
        groups={groups}
        initialBudget={{ Arriendo: 400000, Suscripciones: 15000 }}
        transactions={[]}
        selectedMonth="2026-07"
        onSave={onSave}
        onOpenTransaction={onOpenTransaction}
        onSaveUnitConfig={onSaveUnitConfig}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Categorías/ }));

    fireEvent.click(screen.getByRole("button", { name: /Excluir Suscripciones/, hidden: true }));

    expect(toggleExcludedCategoryMock).toHaveBeenCalledWith("2026-07", "Suscripciones");

    const tableView = screen.getByTestId("budget-table");
    expect(within(tableView).queryByText("Suscripciones")).toBeNull();
  });
});

describe("BudgetTab — unit mode (unit amount × quantity × factor)", () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onSaveUnitConfig = vi.fn().mockResolvedValue(undefined);
  const onOpenTransaction = vi.fn();

  const expenseGroups = [
    { name: "Gastos fijos", type: "expense" as const, categories: ["DBT", "Arriendo"] },
  ];

  type BudgetTabProps = Parameters<typeof BudgetTab>[0];

  function renderTab(overrides: Partial<BudgetTabProps> = {}) {
    onSave.mockClear();
    onSaveUnitConfig.mockClear();
    return render(
      <BudgetTab
        groups={expenseGroups}
        initialBudget={{ DBT: 0, Arriendo: 400000 }}
        initialUnitConfig={{}}
        transactions={[]}
        selectedMonth="2026-06"
        onSave={onSave}
        onSaveUnitConfig={onSaveUnitConfig}
        onOpenTransaction={onOpenTransaction}
        {...overrides}
      />
    );
  }

  function rowFor(container: HTMLElement, category: string): HTMLElement {
    return within(container).getByText(category).closest("[aria-disabled]") as HTMLElement;
  }

  // 3.1 — satisfies: per-category unit-mode toggle renders 3 fields; sibling stays flat
  it("enabling unit mode on one category renders 3 unit fields while a sibling category stays flat", () => {
    renderTab();
    const tableView = screen.getByTestId("budget-table");
    const dbtRow = rowFor(tableView, "DBT");
    fireEvent.click(within(dbtRow).getByRole("button", { name: "Unitario" }));

    expect(within(dbtRow).getByLabelText("Monto unitario")).toBeTruthy();
    expect(within(dbtRow).getByLabelText("Cantidad")).toBeTruthy();
    expect(within(dbtRow).getByLabelText("Factor")).toBeTruthy();

    const arriendoRow = rowFor(tableView, "Arriendo");
    expect(within(arriendoRow).queryByLabelText("Monto unitario")).toBeNull();
    expect(within(arriendoRow).getByPlaceholderText("0")).toBeTruthy();

    // mirrored in the mobile cards view (same shared state)
    const cardsView = screen.getByTestId("budget-cards");
    const dbtCard = rowFor(cardsView, "DBT");
    expect(within(dbtCard).getByLabelText("Monto unitario")).toBeTruthy();
  });

  // 3.2 — satisfies: blur recomputes total, writes budget[cat] and unit config (55000×5×0.9=247500)
  it("blurring a unit field recomputes the read-only total and calls onSave + onSaveUnitConfig with the derived breakdown", async () => {
    renderTab();
    const tableView = screen.getByTestId("budget-table");
    const dbtRow = rowFor(tableView, "DBT");
    fireEvent.click(within(dbtRow).getByRole("button", { name: "Unitario" }));

    fireEvent.blur(within(dbtRow).getByLabelText("Monto unitario"), { target: { value: "55000" } });
    fireEvent.blur(within(dbtRow).getByLabelText("Cantidad"), { target: { value: "5" } });
    fireEvent.blur(within(dbtRow).getByLabelText("Factor"), { target: { value: "0.9" } });

    expect(within(dbtRow).getByText("$247.500")).toBeTruthy();
    await waitFor(() => {
      expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ DBT: 247500 }));
    });
    expect(onSaveUnitConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({ DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 } })
    );
  });

  // 3.3 — satisfies: disabling unit mode falls back to the flat total
  it("disabling unit mode restores a flat input pre-filled with the last derived total", () => {
    renderTab({
      initialBudget: { DBT: 247500, Arriendo: 400000 },
      initialUnitConfig: { DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 } },
    });
    const tableView = screen.getByTestId("budget-table");
    const dbtRow = rowFor(tableView, "DBT");
    fireEvent.click(within(dbtRow).getByRole("button", { name: "Fijo" }));

    expect(within(dbtRow).queryByLabelText("Monto unitario")).toBeNull();
    const flatInput = within(dbtRow).getByPlaceholderText("0") as HTMLInputElement;
    expect(flatInput.value).toBe("247500");
  });

  // 3.4 — satisfies: "Copiar desde" carries unit config + recomputes; flat-only category unaffected
  it("'Copiar desde' carries a unit-mode category's config and recomputes its total; a flat-only category copies unaffected", async () => {
    getBudgetForMonthMock.mockResolvedValueOnce({ DBT: 247500, Arriendo: 300000 });
    getBudgetUnitConfigForMonthMock.mockResolvedValueOnce({
      DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 },
    });

    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /^Copiar$/ }));

    await waitFor(() => {
      expect(onSaveUnitConfig).toHaveBeenCalledWith({
        DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 },
      });
    });

    const tableView = screen.getByTestId("budget-table");
    const dbtRow = rowFor(tableView, "DBT");
    expect(within(dbtRow).getByLabelText("Monto unitario")).toBeTruthy();
    expect(within(dbtRow).getByText("$247.500")).toBeTruthy();

    const arriendoRow = rowFor(tableView, "Arriendo");
    expect(within(arriendoRow).queryByLabelText("Monto unitario")).toBeNull();
    const flatInput = within(arriendoRow).getByPlaceholderText("0") as HTMLInputElement;
    expect(flatInput.value).toBe("300000");

    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({ DBT: 247500, Arriendo: 300000 })
    );
  });

  it("a closed category's unit-mode toggle and fields stay disabled and inert", () => {
    renderTab({
      initialBudget: { DBT: 247500, Arriendo: 400000 },
      initialUnitConfig: { DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 } },
      initialClosedCategories: ["DBT"],
    });
    const tableView = screen.getByTestId("budget-table");
    const dbtRow = rowFor(tableView, "DBT");

    const toggleButton = within(dbtRow).getByRole("button", { name: "Fijo" });
    expect((toggleButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(toggleButton);
    expect(onSaveUnitConfig).not.toHaveBeenCalled();

    const unitAmountInput = within(dbtRow).getByLabelText("Monto unitario") as HTMLInputElement;
    expect(unitAmountInput.disabled).toBe(true);
    fireEvent.blur(unitAmountInput, { target: { value: "99999" } });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("toggling unit mode off then back on restores the previous breakdown instead of resetting quantity/factor", () => {
    renderTab({
      initialBudget: { DBT: 247500, Arriendo: 400000 },
      initialUnitConfig: { DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 } },
    });
    const tableView = screen.getByTestId("budget-table");
    const dbtRow = rowFor(tableView, "DBT");

    fireEvent.click(within(dbtRow).getByRole("button", { name: "Fijo" }));
    fireEvent.click(within(dbtRow).getByRole("button", { name: "Unitario" }));

    const unitAmountInput = within(dbtRow).getByLabelText("Monto unitario") as HTMLInputElement;
    const quantityInput = within(dbtRow).getByLabelText("Cantidad") as HTMLInputElement;
    const factorInput = within(dbtRow).getByLabelText("Factor") as HTMLInputElement;
    expect(unitAmountInput.value).toBe("55000");
    expect(quantityInput.value).toBe("5");
    expect(factorInput.value).toBe("0.9");
  });
});

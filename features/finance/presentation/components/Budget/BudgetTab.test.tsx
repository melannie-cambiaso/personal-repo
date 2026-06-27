import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryCard } from "./BudgetTab";

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

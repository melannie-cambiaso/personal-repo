import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MovementSummary } from "./MovementSummary";
import type { TransactionTotals } from "@/features/finance-v2/domain";

describe("MovementSummary", () => {
  it("shows balance (income minus expense minus savings) alongside savings reported as its own separate total", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 250, balance: 350 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByText("$350")).toBeTruthy();
    expect(screen.getByText("Ahorro")).toBeTruthy();

    const breakdownLine = screen.getByText("$1.000").parentElement;
    const savingsFigures = screen.getAllByText("$250");
    expect(savingsFigures).toHaveLength(2);
    const ahorro = savingsFigures.find((el) => el.parentElement !== breakdownLine)!;
    expect(ahorro).toBeTruthy();
  });

  it("renders zeroes for an empty month", () => {
    const totals: TransactionTotals = { income: 0, expense: 0, savings: 0, balance: 0 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getAllByText("$0")).toHaveLength(5);
  });

  it("renders the income/expense/savings breakdown below the Balance row, reconciling with Balance", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 250, balance: 350 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getByText("$1.000")).toBeTruthy();
    expect(screen.getByText("$400")).toBeTruthy();

    const breakdownLine = screen.getByText("$1.000").parentElement;
    const segment = screen.getAllByText("$250").find((el) => el.parentElement === breakdownLine)!;
    expect(segment).toBeTruthy();

    expect(screen.getByText("$350")).toBeTruthy();
  });

  it("colors the income breakdown figure green", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 250, balance: 350 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getByText("$1.000").className).toContain("text-green-700");
    expect(screen.getByText("$1.000").className).toContain("font-bold");
  });

  it("colors the expense breakdown figure red", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 250, balance: 350 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getByText("$400").className).toContain("text-red-700");
    expect(screen.getByText("$400").className).toContain("font-bold");
  });

  it("colors the savings breakdown figure amber, distinct from income and expense", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 250, balance: 350 };

    render(<MovementSummary totals={totals} />);

    const breakdownLine = screen.getByText("$1.000").parentElement;
    const segment = screen.getAllByText("$250").find((el) => el.parentElement === breakdownLine)!;
    expect(segment.className).toContain("text-amber-700");
    expect(segment.className).toContain("font-bold");
    expect(segment.className).not.toContain("text-green-700");
    expect(segment.className).not.toContain("text-red-700");
  });

  it("renders the savings segment even when savings is 0", () => {
    const totals: TransactionTotals = { income: 800, expense: 500, savings: 0, balance: 300 };

    render(<MovementSummary totals={totals} />);

    const breakdownLine = screen.getByText("$800").parentElement;
    const segment = screen.getAllByText("$0").find((el) => el.parentElement === breakdownLine);
    expect(segment).toBeTruthy();
    expect(segment?.className).toContain("text-amber-700");
  });

  it("groups income, expense, and savings as siblings in the same breakdown sub-line", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 250, balance: 350 };

    render(<MovementSummary totals={totals} />);

    const income = screen.getByText("$1.000");
    const expense = screen.getByText("$400");
    const breakdownLine = income.parentElement;
    const savings = screen.getAllByText("$250").find((el) => el.parentElement === breakdownLine)!;

    expect(expense.parentElement).toBe(breakdownLine);
    expect(savings.parentElement).toBe(breakdownLine);
    expect(breakdownLine?.className).toContain("text-xs");
  });

  it("keeps the net Balance figure neutral, not colored by sign", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 250, balance: 350 };

    render(<MovementSummary totals={totals} />);

    const balance = screen.getByText("$350");
    expect(balance.className).toContain("text-brown-800");
    expect(balance.className).toContain("font-bold");
    expect(balance.className).not.toContain("text-green-700");
    expect(balance.className).not.toContain("text-red-700");
  });

  it("keeps the Ahorro figure styling unchanged", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 250, balance: 350 };

    render(<MovementSummary totals={totals} />);

    const breakdownLine = screen.getByText("$1.000").parentElement;
    const savingsFigures = screen.getAllByText("$250");
    const ahorro = savingsFigures.find((el) => el.parentElement !== breakdownLine)!;
    expect(ahorro.className).toContain("text-brown-800");
    expect(ahorro.className).toContain("font-bold");
  });
});

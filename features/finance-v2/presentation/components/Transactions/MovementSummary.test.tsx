import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MovementSummary } from "./MovementSummary";
import type { TransactionTotals } from "@/features/finance-v2/domain";

describe("MovementSummary", () => {
  it("shows balance and savings as two SEPARATE totals — savings never folds into balance", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 200, balance: 600 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByText("$600")).toBeTruthy();
    expect(screen.getByText("Ahorro")).toBeTruthy();
    expect(screen.getByText("$200")).toBeTruthy();
  });

  it("renders zeroes for an empty month", () => {
    const totals: TransactionTotals = { income: 0, expense: 0, savings: 0, balance: 0 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getAllByText("$0")).toHaveLength(4);
  });

  it("renders the income/expense breakdown below the Balance row", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 200, balance: 600 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getByText("$1.000")).toBeTruthy();
    expect(screen.getByText("$400")).toBeTruthy();
  });

  it("colors the income breakdown figure green", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 200, balance: 600 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getByText("$1.000").className).toContain("text-green-700");
  });

  it("colors the expense breakdown figure red", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 200, balance: 600 };

    render(<MovementSummary totals={totals} />);

    expect(screen.getByText("$400").className).toContain("text-red-700");
  });

  it("groups income and expense as siblings in the same breakdown sub-line", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 200, balance: 600 };

    render(<MovementSummary totals={totals} />);

    const income = screen.getByText("$1.000");
    const expense = screen.getByText("$400");
    expect(income.parentElement).toBe(expense.parentElement);
    expect(income.parentElement?.className).toContain("text-xs");
  });

  it("keeps the net Balance figure neutral, not colored by sign", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 200, balance: 600 };

    render(<MovementSummary totals={totals} />);

    const balance = screen.getByText("$600");
    expect(balance.className).toContain("text-brown-800");
    expect(balance.className).toContain("font-bold");
    expect(balance.className).not.toContain("text-green-700");
    expect(balance.className).not.toContain("text-red-700");
  });

  it("keeps the Ahorro figure styling unchanged", () => {
    const totals: TransactionTotals = { income: 1000, expense: 400, savings: 200, balance: 600 };

    render(<MovementSummary totals={totals} />);

    const savings = screen.getByText("$200");
    expect(savings.className).toContain("text-brown-800");
    expect(savings.className).toContain("font-bold");
  });
});

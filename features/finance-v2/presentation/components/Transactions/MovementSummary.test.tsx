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

    expect(screen.getAllByText("$0")).toHaveLength(2);
  });
});

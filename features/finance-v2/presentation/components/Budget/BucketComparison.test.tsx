import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BucketComparison } from "./BucketComparison";
import type { BudgetComparison } from "@/features/finance-v2/domain";

describe("BucketComparison", () => {
  it("with-targets: renders both the budgeted figure and the target figure per row", () => {
    const comparison: BudgetComparison = {
      status: "with-targets",
      rows: [
        { key: "fixed", budgeted: 400_000, target: 500_000 },
        { key: "variable", budgeted: 100_000, target: 300_000 },
        { key: "savings", budgeted: 0, target: 200_000 },
      ],
    };
    render(<BucketComparison comparison={comparison} />);

    expect(screen.getByText("Fijos")).toBeTruthy();
    expect(screen.getByText("Variables")).toBeTruthy();
    expect(screen.getByText("Ahorro")).toBeTruthy();
    expect(screen.getByText("$400.000")).toBeTruthy();
    expect(screen.getByText(/500\.000/)).toBeTruthy();
    expect(screen.getByText("$100.000")).toBeTruthy();
    expect(screen.getByText(/300\.000/)).toBeTruthy();
  });

  it("budget-only: renders only the budgeted figure, no target copy", () => {
    const comparison: BudgetComparison = {
      status: "budget-only",
      rows: [
        { key: "fixed", budgeted: 400_000 },
        { key: "variable", budgeted: 100_000 },
        { key: "savings", budgeted: 0 },
      ],
    };
    render(<BucketComparison comparison={comparison} />);

    expect(screen.getByText("$400.000")).toBeTruthy();
    expect(screen.queryByText(/de \$/)).toBeNull();
  });
});

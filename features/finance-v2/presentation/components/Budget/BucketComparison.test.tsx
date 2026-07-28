import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BucketComparison } from "./BucketComparison";
import type { BudgetComparison, SpendComparison } from "@/features/finance-v2/domain";
import type { SpendView } from "./spendView";

const readyComparison: SpendComparison = {
  categories: {},
  leaves: {},
  buckets: [
    { key: "fixed", budgeted: 400_000, spent: 200_000, unassigned: 0 },
    { key: "variable", budgeted: 100_000, spent: 50_000, unassigned: 0 },
    { key: "savings", budgeted: 0, spent: 0, unassigned: 0 },
  ],
  total: { budgeted: 500_000, spent: 250_000, unassigned: 0 },
};

const readySpend: SpendView = { status: "ready", comparison: readyComparison };
const loadingSpend: SpendView = { status: "loading" };

describe("BucketComparison", () => {
  it("with-targets: renders both the budgeted figure and the target figure per row", () => {
    const comparison: BudgetComparison = {
      status: "with-targets",
      rows: [
        { key: "fixed", budgeted: 400_000, target: 600_000 },
        { key: "variable", budgeted: 100_000, target: 300_000 },
        { key: "savings", budgeted: 0, target: 200_000 },
      ],
      total: { budgeted: 500_000, target: 1_100_000 },
    };
    render(<BucketComparison comparison={comparison} spend={readySpend} />);

    expect(screen.getByText("Fijos")).toBeTruthy();
    expect(screen.getByText("Variables")).toBeTruthy();
    expect(screen.getByText("Ahorro")).toBeTruthy();
    expect(screen.getByText("$400.000")).toBeTruthy();
    expect(screen.getByText(/600\.000/)).toBeTruthy();
    expect(screen.getByText("$100.000")).toBeTruthy();
    expect(screen.getByText(/300\.000/)).toBeTruthy();
    expect(screen.getByText("Total")).toBeTruthy();
    expect(screen.getByText("$500.000")).toBeTruthy();
    expect(screen.getByText(/1\.100\.000/)).toBeTruthy();
  });

  it("budget-only: renders only the budgeted figure, no target copy", () => {
    const comparison: BudgetComparison = {
      status: "budget-only",
      rows: [
        { key: "fixed", budgeted: 400_000 },
        { key: "variable", budgeted: 100_000 },
        { key: "savings", budgeted: 0 },
      ],
      total: { budgeted: 500_000 },
    };
    render(<BucketComparison comparison={comparison} spend={readySpend} />);

    expect(screen.getByText("$400.000")).toBeTruthy();
    expect(screen.getByText("Total")).toBeTruthy();
    expect(screen.getByText("$500.000")).toBeTruthy();
    expect(screen.queryByText(/de \$600\.000/)).toBeNull();
    expect(screen.queryByText(/de \$1\.100\.000/)).toBeNull();
  });

  const comparison: BudgetComparison = {
    status: "budget-only",
    rows: [
      { key: "fixed", budgeted: 400_000 },
      { key: "variable", budgeted: 100_000 },
      { key: "savings", budgeted: 0 },
    ],
    total: { budgeted: 500_000 },
  };

  describe("actual spend column", () => {
    it("renders the actual spend figure paired with the budgeted amount for each bucket and the total", () => {
      render(<BucketComparison comparison={comparison} spend={readySpend} />);

      expect(screen.getByText("$200.000")).toBeTruthy();
      expect(screen.getAllByText(/de \$400\.000/).length).toBeGreaterThan(0);
      expect(screen.getByText("$50.000")).toBeTruthy();
      expect(screen.getAllByText(/de \$100\.000/).length).toBeGreaterThan(0);
      expect(screen.getByText("$250.000")).toBeTruthy();
      expect(screen.getAllByText(/de \$500\.000/).length).toBeGreaterThan(0);
    });

    it("flags an overrun bucket with the excedido suffix", () => {
      const overrunComparison: SpendComparison = {
        categories: {},
        leaves: {},
        buckets: [
          { key: "fixed", budgeted: 400_000, spent: 450_000, unassigned: 0 },
          { key: "variable", budgeted: 100_000, spent: 50_000, unassigned: 0 },
          { key: "savings", budgeted: 0, spent: 0, unassigned: 0 },
        ],
        total: { budgeted: 500_000, spent: 500_000, unassigned: 0 },
      };
      render(
        <BucketComparison comparison={comparison} spend={{ status: "ready", comparison: overrunComparison }} />
      );

      expect(screen.getByText(/excedido/)).toBeTruthy();
    });

    it("does not flag a bucket whose spend exactly equals its budget", () => {
      render(<BucketComparison comparison={comparison} spend={readySpend} />);

      expect(screen.queryByText(/excedido/)).toBeNull();
    });

    it("renders a sin categoría note when a bucket carries unassigned spend", () => {
      const withUnassigned: SpendComparison = {
        categories: {},
        leaves: {},
        buckets: [
          { key: "fixed", budgeted: 400_000, spent: 208_000, unassigned: 8_000 },
          { key: "variable", budgeted: 100_000, spent: 50_000, unassigned: 0 },
          { key: "savings", budgeted: 0, spent: 0, unassigned: 0 },
        ],
        total: { budgeted: 500_000, spent: 258_000, unassigned: 8_000 },
      };
      render(
        <BucketComparison comparison={comparison} spend={{ status: "ready", comparison: withUnassigned }} />
      );

      expect(screen.getAllByText(/sin categoría/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\$8\.000/).length).toBeGreaterThan(0);
    });

    it("omits the sin categoría note when a bucket has no unassigned spend", () => {
      render(<BucketComparison comparison={comparison} spend={readySpend} />);

      expect(screen.queryByText(/sin categoría/)).toBeNull();
    });

    it("renders — instead of any figure while the month is still loading, never a false $0", () => {
      render(<BucketComparison comparison={comparison} spend={loadingSpend} />);

      expect(screen.getAllByText("—")).toHaveLength(4);
      expect(screen.queryByText("$200.000")).toBeNull();
      expect(screen.queryByText("$50.000")).toBeNull();
      expect(screen.queryByText("$250.000")).toBeNull();
    });
  });
});

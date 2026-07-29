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
  it("renders each bucket label with its sharePct, no percentage on Total, and no standalone budgeted figure", () => {
    const comparison: BudgetComparison = {
      rows: [
        { key: "fixed", budgeted: 400_000, sharePct: 80 },
        { key: "variable", budgeted: 100_000, sharePct: 20 },
        { key: "savings", budgeted: 0, sharePct: 0 },
      ],
      total: { budgeted: 500_000 },
    };
    render(<BucketComparison comparison={comparison} spend={readySpend} />);

    expect(screen.getByText("Fijos (80%)")).toBeTruthy();
    expect(screen.getByText("Variables (20%)")).toBeTruthy();
    expect(screen.getByText("Ahorro (0%)")).toBeTruthy();
    expect(screen.getByText("Total")).toBeTruthy();
    expect(screen.queryByText(/Total \(/)).toBeNull();
    // The budgeted amount only appears inside the "de $X" spend pairing now, never on its own.
    expect(screen.queryByText("$400.000")).toBeNull();
    expect(screen.queryByText("$100.000")).toBeNull();
    expect(screen.queryByText("$500.000")).toBeNull();
  });

  it("renders (0%) for every bucket when the total budgeted is 0, never NaN or Infinity", () => {
    const comparison: BudgetComparison = {
      rows: [
        { key: "fixed", budgeted: 0, sharePct: 0 },
        { key: "variable", budgeted: 0, sharePct: 0 },
        { key: "savings", budgeted: 0, sharePct: 0 },
      ],
      total: { budgeted: 0 },
    };
    render(<BucketComparison comparison={comparison} spend={readySpend} />);

    expect(screen.getByText("Fijos (0%)")).toBeTruthy();
    expect(screen.getByText("Variables (0%)")).toBeTruthy();
    expect(screen.getByText("Ahorro (0%)")).toBeTruthy();
    expect(screen.queryByText(/NaN/)).toBeNull();
    expect(screen.queryByText(/Infinity/)).toBeNull();
  });

  const comparison: BudgetComparison = {
    rows: [
      { key: "fixed", budgeted: 400_000, sharePct: 80 },
      { key: "variable", budgeted: 100_000, sharePct: 20 },
      { key: "savings", budgeted: 0, sharePct: 0 },
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

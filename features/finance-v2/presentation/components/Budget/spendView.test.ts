import { describe, it, expect } from "vitest";
import type { SpendComparison } from "@/features/finance-v2/domain";
import { toSpendView } from "./spendView";

const comparisonFixture: SpendComparison = {
  categories: { c1: { budgeted: 100000, spent: 60000 } },
  leaves: { c1: { budgeted: 100000, spent: 60000 } },
  buckets: [
    { key: "fixed", budgeted: 100000, spent: 60000, unassigned: 0 },
    { key: "variable", budgeted: 0, spent: 0, unassigned: 0 },
    { key: "savings", budgeted: 0, spent: 0, unassigned: 0 },
  ],
  total: { budgeted: 100000, spent: 60000, unassigned: 0 },
};

describe("toSpendView", () => {
  it("reports loading and discards the comparison while the month is still in flight", () => {
    expect(toSpendView(true, comparisonFixture)).toEqual({ status: "loading" });
  });

  it("reports ready with the given comparison once the month has finished loading", () => {
    expect(toSpendView(false, comparisonFixture)).toEqual({
      status: "ready",
      comparison: comparisonFixture,
    });
  });
});

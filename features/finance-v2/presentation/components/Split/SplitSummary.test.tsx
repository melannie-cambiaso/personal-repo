import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SplitSummary } from "./SplitSummary";
import type { SplitResult } from "@/features/finance-v2/domain";

describe("SplitSummary", () => {
  it("valid split: renders three CLP amounts, no progress bar", () => {
    const split: SplitResult = {
      status: "valid",
      buckets: [
        { key: "fixed", percentage: 50, amount: 500_000 },
        { key: "variable", percentage: 30, amount: 300_000 },
        { key: "savings", percentage: 20, amount: 200_000 },
      ],
    };
    render(<SplitSummary split={split} />);
    expect(screen.getByText("$500.000")).toBeTruthy();
    expect(screen.getByText("$300.000")).toBeTruthy();
    expect(screen.getByText("$200.000")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("valid split: renders bucket labels in fixed, variable, savings order", () => {
    const split: SplitResult = {
      status: "valid",
      buckets: [
        { key: "fixed", percentage: 50, amount: 500_000 },
        { key: "variable", percentage: 30, amount: 300_000 },
        { key: "savings", percentage: 20, amount: 200_000 },
      ],
    };
    render(<SplitSummary split={split} />);
    expect(screen.getByText("Fijos")).toBeTruthy();
    expect(screen.getByText("Variables")).toBeTruthy();
    expect(screen.getByText("Ahorro")).toBeTruthy();
  });

  it("invalid split: renders only the validation error, no amounts (no stale figures)", () => {
    const split: SplitResult = {
      status: "invalid",
      reason: "percentages-must-sum-to-100",
      totalPercentage: 110,
    };
    render(<SplitSummary split={split} />);
    expect(screen.queryByText(/\$/)).toBeNull();
    expect(screen.getByText(/110/)).toBeTruthy();
  });

  it("invalid split: shows an error message signalling the sum-to-100 requirement", () => {
    const split: SplitResult = {
      status: "invalid",
      reason: "percentages-must-sum-to-100",
      totalPercentage: 90,
    };
    render(<SplitSummary split={split} />);
    expect(screen.getByText(/100/)).toBeTruthy();
  });
});

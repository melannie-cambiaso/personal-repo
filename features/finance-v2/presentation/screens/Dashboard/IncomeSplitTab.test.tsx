import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IncomeSplitTab } from "./IncomeSplitTab";
import { DEFAULT_FINANCE_V2_CONFIG } from "@/features/finance-v2/domain";
import type { FinanceV2Config, SplitResult } from "@/features/finance-v2/domain";

const validSplit: SplitResult = {
  status: "valid",
  buckets: [
    { key: "fixed", percentage: 50, amount: 500_000 },
    { key: "variable", percentage: 30, amount: 300_000 },
    { key: "savings", percentage: 20, amount: 200_000 },
  ],
};

describe("IncomeSplitTab", () => {
  it("renders the config's income and percentage values", () => {
    const saved: FinanceV2Config = {
      income: 1_000_000,
      fixedPct: 50,
      variablePct: 30,
      savingsPct: 20,
    };
    render(
      <IncomeSplitTab
        config={saved}
        split={validSplit}
        onIncomeBlur={vi.fn()}
        onPercentageBlur={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("1000000")).toBeTruthy();
    expect(screen.getByDisplayValue("50")).toBeTruthy();
    expect(screen.getByDisplayValue("30")).toBeTruthy();
    expect(screen.getByDisplayValue("20")).toBeTruthy();
  });

  it("renders SplitSummary with the computed split", () => {
    render(
      <IncomeSplitTab
        config={DEFAULT_FINANCE_V2_CONFIG}
        split={validSplit}
        onIncomeBlur={vi.fn()}
        onPercentageBlur={vi.fn()}
      />
    );

    expect(screen.getByText("$500.000")).toBeTruthy();
    expect(screen.getByText("$300.000")).toBeTruthy();
    expect(screen.getByText("$200.000")).toBeTruthy();
  });

  it("calls onIncomeBlur with the raw value on income blur", () => {
    const onIncomeBlur = vi.fn();
    render(
      <IncomeSplitTab
        config={DEFAULT_FINANCE_V2_CONFIG}
        split={validSplit}
        onIncomeBlur={onIncomeBlur}
        onPercentageBlur={vi.fn()}
      />
    );

    fireEvent.blur(screen.getByLabelText("Ingreso mensual"), { target: { value: "1500000" } });
    expect(onIncomeBlur).toHaveBeenCalledWith("1500000");
  });

  it("calls onPercentageBlur with the bucket key and raw value on percentage blur", () => {
    const onPercentageBlur = vi.fn();
    render(
      <IncomeSplitTab
        config={DEFAULT_FINANCE_V2_CONFIG}
        split={validSplit}
        onIncomeBlur={vi.fn()}
        onPercentageBlur={onPercentageBlur}
      />
    );

    fireEvent.blur(screen.getByLabelText("Fijos"), { target: { value: "60" } });
    expect(onPercentageBlur).toHaveBeenCalledWith("fixed", "60");
  });

  it("remounts the income input even when the clamped value is unchanged (version counter)", () => {
    render(
      <IncomeSplitTab
        config={DEFAULT_FINANCE_V2_CONFIG}
        split={validSplit}
        onIncomeBlur={vi.fn()}
        onPercentageBlur={vi.fn()}
      />
    );

    // income is already 0 (empty display); blurring "-500" clamps to 0 again — the
    // stale, un-clamped "-500" text must not remain in the DOM.
    fireEvent.blur(screen.getByLabelText("Ingreso mensual"), { target: { value: "-500" } });

    expect((screen.getByLabelText("Ingreso mensual") as HTMLInputElement).value).toBe("");
  });
});

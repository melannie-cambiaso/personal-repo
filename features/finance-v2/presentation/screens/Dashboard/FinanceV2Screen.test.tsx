import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FinanceV2Screen } from "./FinanceV2Screen";
import { DEFAULT_FINANCE_V2_CONFIG } from "@/features/finance-v2/domain";
import type { FinanceV2Config } from "@/features/finance-v2/domain";

describe("FinanceV2Screen", () => {
  it("shows the 50/30/20 empty-state defaults and zero amounts when nothing was ever saved", () => {
    render(<FinanceV2Screen initialConfig={DEFAULT_FINANCE_V2_CONFIG} onSave={vi.fn()} />);

    expect((screen.getByLabelText("Ingreso mensual") as HTMLInputElement).value).toBe("");
    expect(screen.getByDisplayValue("50")).toBeTruthy();
    expect(screen.getByDisplayValue("30")).toBeTruthy();
    expect(screen.getByDisplayValue("20")).toBeTruthy();
    expect(screen.getAllByText("$0")).toHaveLength(3);
  });

  it("renders a previously saved config and its computed amounts", () => {
    const saved: FinanceV2Config = {
      income: 1_000_000,
      fixedPct: 50,
      variablePct: 30,
      savingsPct: 20,
    };

    render(<FinanceV2Screen initialConfig={saved} onSave={vi.fn()} />);

    expect(screen.getByDisplayValue("1000000")).toBeTruthy();
    expect(screen.getByText("$500.000")).toBeTruthy();
    expect(screen.getByText("$300.000")).toBeTruthy();
    expect(screen.getByText("$200.000")).toBeTruthy();
  });

  it("hides the computed amounts and shows the error while an edit makes the split invalid, then restores them once corrected", () => {
    const onSave = vi.fn();
    render(<FinanceV2Screen initialConfig={DEFAULT_FINANCE_V2_CONFIG} onSave={onSave} />);

    fireEvent.blur(screen.getByLabelText("Fijos"), { target: { value: "60" } });

    expect(screen.queryByText(/\$/)).toBeNull();
    expect(screen.getByText(/deben sumar 100%/)).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText("Variables"), { target: { value: "20" } });

    expect(screen.queryByText(/deben sumar 100%/)).toBeNull();
    expect(screen.getAllByText("$0")).toHaveLength(3);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("clamps a negative income to 0 on blur", () => {
    render(<FinanceV2Screen initialConfig={DEFAULT_FINANCE_V2_CONFIG} onSave={vi.fn()} />);

    fireEvent.blur(screen.getByLabelText("Ingreso mensual"), { target: { value: "-500" } });

    expect((screen.getByLabelText("Ingreso mensual") as HTMLInputElement).value).toBe("");
  });
});

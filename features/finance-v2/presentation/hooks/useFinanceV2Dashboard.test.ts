import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinanceV2Dashboard } from "./useFinanceV2Dashboard";
import type { FinanceV2Config } from "@/features/finance-v2/domain";

const makeConfig = (overrides: Partial<FinanceV2Config> = {}): FinanceV2Config => ({
  income: 1_000_000,
  fixedPct: 50,
  variablePct: 30,
  savingsPct: 20,
  ...overrides,
});

const onSave = vi.fn();

describe("useFinanceV2Dashboard", () => {
  beforeEach(() => {
    onSave.mockReset();
  });

  it("initializes config and split from initialConfig (valid sum)", () => {
    const initialConfig = makeConfig();
    const { result } = renderHook(() => useFinanceV2Dashboard({ initialConfig, onSave }));
    expect(result.current.config).toEqual(initialConfig);
    expect(result.current.split.status).toBe("valid");
  });

  it("handleIncomeBlur clamps a negative raw value to 0", () => {
    const initialConfig = makeConfig();
    const { result } = renderHook(() => useFinanceV2Dashboard({ initialConfig, onSave }));
    act(() => result.current.handleIncomeBlur("-500"));
    expect(result.current.config.income).toBe(0);
  });

  it("handlePercentageBlur clamps a >100 raw value to 100 for the edited bucket only", () => {
    const initialConfig = makeConfig();
    const { result } = renderHook(() => useFinanceV2Dashboard({ initialConfig, onSave }));
    act(() => result.current.handlePercentageBlur("fixed", "150"));
    expect(result.current.config.fixedPct).toBe(100);
    expect(result.current.config.variablePct).toBe(30);
    expect(result.current.config.savingsPct).toBe(20);
  });

  it("valid edit (percentages still sum to 100) calls onSave once with the clamped config", () => {
    const initialConfig = makeConfig();
    const { result } = renderHook(() => useFinanceV2Dashboard({ initialConfig, onSave }));
    act(() => result.current.handleIncomeBlur("2000000"));
    expect(result.current.split.status).toBe("valid");
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith({ ...initialConfig, income: 2_000_000 });
  });

  it("invalid edit (percentages no longer sum to 100) updates config but does not call onSave", () => {
    const initialConfig = makeConfig();
    const { result } = renderHook(() => useFinanceV2Dashboard({ initialConfig, onSave }));
    act(() => result.current.handlePercentageBlur("fixed", "60"));
    expect(result.current.config.fixedPct).toBe(60);
    expect(result.current.split.status).toBe("invalid");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("split flips from invalid back to valid once percentages sum to 100 again, and onSave is then called", () => {
    const initialConfig = makeConfig();
    const { result } = renderHook(() => useFinanceV2Dashboard({ initialConfig, onSave }));
    act(() => result.current.handlePercentageBlur("fixed", "60"));
    expect(result.current.split.status).toBe("invalid");
    expect(onSave).not.toHaveBeenCalled();

    act(() => result.current.handlePercentageBlur("fixed", "50"));
    expect(result.current.split.status).toBe("valid");
    expect(onSave).toHaveBeenCalledOnce();
  });
});

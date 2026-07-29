import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinanceV2Budget } from "./useFinanceV2Budget";
import type { BudgetConfig, SplitResult } from "@/features/finance-v2/domain";

const validSplit: SplitResult = {
  status: "valid",
  buckets: [
    { key: "fixed", percentage: 50, amount: 500_000 },
    { key: "variable", percentage: 30, amount: 300_000 },
    { key: "savings", percentage: 20, amount: 200_000 },
  ],
};

const onSave = vi.fn();

describe("useFinanceV2Budget", () => {
  beforeEach(() => {
    onSave.mockReset();
  });

  it("initializes categories from initialBudget and derives comparison from the budgeted amounts", () => {
    const initialBudget: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 100_000, subcategories: [] }],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialBudget, split: validSplit, onSave })
    );

    expect(result.current.categories).toEqual(initialBudget.categories);
    expect(result.current.comparison.rows.find((r) => r.key === "fixed")?.budgeted).toBe(100_000);
  });

  it("addCategory appends a new childless category and calls onSave once with the resulting config", () => {
    const initialBudget: BudgetConfig = { categories: [] };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialBudget, split: validSplit, onSave })
    );

    act(() => result.current.addCategory("Arriendo", "fixed"));

    expect(result.current.categories).toHaveLength(1);
    expect(result.current.categories[0]).toMatchObject({ name: "Arriendo", bucket: "fixed", amount: 0 });
    expect(onSave).toHaveBeenCalledOnce();
    expect((onSave.mock.calls[0][0] as BudgetConfig).categories).toHaveLength(1);
  });

  it("addCategory with a blank name does nothing and does not call onSave", () => {
    const initialBudget: BudgetConfig = { categories: [] };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialBudget, split: validSplit, onSave })
    );

    act(() => result.current.addCategory("   ", "fixed"));

    expect(result.current.categories).toHaveLength(0);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("addSubcategory appends under the matching category and calls onSave once", () => {
    const initialBudget: BudgetConfig = {
      categories: [{ id: "c1", name: "Servicios", bucket: "fixed", amount: 0, subcategories: [] }],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialBudget, split: validSplit, onSave })
    );

    act(() => result.current.addSubcategory("c1", "Luz", "fixed"));

    expect(result.current.categories[0].subcategories).toHaveLength(1);
    expect(result.current.categories[0].subcategories[0]).toMatchObject({ name: "Luz", bucket: "fixed", amount: 0 });
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("deleteCategory cascades and the next comparison reflects the removed leaf's bucket total", () => {
    const initialBudget: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 100_000, subcategories: [] }],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialBudget, split: validSplit, onSave })
    );

    act(() => result.current.deleteCategory("c1"));

    expect(result.current.categories).toHaveLength(0);
    expect(onSave).toHaveBeenCalledOnce();
    expect(result.current.comparison.rows.find((r) => r.key === "fixed")?.budgeted).toBe(0);
  });

  it("deleteSubcategory removes only the targeted subcategory and calls onSave", () => {
    const initialBudget: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Servicios",
          bucket: "fixed",
          amount: 0,
          subcategories: [
            { id: "s1", name: "Luz", bucket: "fixed", amount: 5000 },
            { id: "s2", name: "Agua", bucket: "fixed", amount: 3000 },
          ],
        },
      ],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialBudget, split: validSplit, onSave })
    );

    act(() => result.current.deleteSubcategory("c1", "s1"));

    expect(result.current.categories[0].subcategories).toEqual([
      { id: "s2", name: "Agua", bucket: "fixed", amount: 3000 },
    ]);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("handleAmountBlur clamps a negative raw value to 0 via clampAmount before setting and saving", () => {
    const initialBudget: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 0, subcategories: [] }],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialBudget, split: validSplit, onSave })
    );

    act(() => result.current.handleAmountBlur("c1", null, "-500"));

    expect(result.current.categories[0].amount).toBe(0);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("handleAmountBlur sets a subcategory's amount when subcategoryId is provided", () => {
    const initialBudget: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Servicios",
          bucket: "fixed",
          amount: 0,
          subcategories: [{ id: "s1", name: "Luz", bucket: "fixed", amount: 0 }],
        },
      ],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialBudget, split: validSplit, onSave })
    );

    act(() => result.current.handleAmountBlur("c1", "s1", "9000"));

    expect(result.current.categories[0].subcategories[0].amount).toBe(9000);
    expect(onSave).toHaveBeenCalledOnce();
  });

  // The "comparison flips from with-targets to budget-only as the split prop changes"
  // test is removed here: `computeBudgetComparison` no longer reads `split` at all
  // (Phase 2 domain collapse), so the behavior it asserted no longer exists. `split`
  // is still accepted on `Params` pending Phase 3's full unthreading — see
  // useFinanceV2Budget.ts.
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFinanceV2Budget } from "./useFinanceV2Budget";
import type { BudgetConfig, BudgetVersion } from "@/features/finance-v2/domain";

const onSave = vi.fn();

const UPDATED_AT = "2026-01-01T00:00:00.000Z";
/** A single legacy version, so every month resolves to `config`. */
const seed = (config: BudgetConfig): BudgetVersion[] => [
  { effectiveFrom: "0000-00", config, updatedAt: UPDATED_AT },
];

const rent = (amount: number): BudgetConfig => ({
  categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount, subcategories: [] }],
});
const fixedBudgeted = (comparison: { rows: { key: string; budgeted: number }[] }) =>
  comparison.rows.find((r) => r.key === "fixed")?.budgeted;

describe("useFinanceV2Budget — versions per month", () => {
  beforeEach(() => {
    onSave.mockReset();
  });

  const versions: BudgetVersion[] = [
    { effectiveFrom: "0000-00", config: rent(100_000), updatedAt: UPDATED_AT },
    { effectiveFrom: "2026-09", config: rent(200_000), updatedAt: UPDATED_AT },
  ];

  it("shows the version in force for the viewed month and follows month changes", () => {
    const { result, rerender } = renderHook(
      ({ month }) => useFinanceV2Budget({ initialVersions: versions, month, onSave }),
      { initialProps: { month: "2026-08" } }
    );

    expect(result.current.categories[0].amount).toBe(100_000);
    expect(fixedBudgeted(result.current.comparison)).toBe(100_000);

    rerender({ month: "2026-09" });
    expect(result.current.categories[0].amount).toBe(200_000);
    expect(fixedBudgeted(result.current.comparison)).toBe(200_000);

    rerender({ month: "2026-07" });
    expect(result.current.categories[0].amount).toBe(100_000);
  });

  it("saves an edit as the viewed month's version and calls onSave(month, config)", () => {
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: versions, month: "2026-10", onSave })
    );

    act(() => result.current.handleAmountBlur("c1", null, "300000"));

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0]).toBe("2026-10");
    expect((onSave.mock.calls[0][1] as BudgetConfig).categories[0]).toMatchObject({
      id: "c1",
      amount: 300_000,
    });
    expect(result.current.categories[0].amount).toBe(300_000);
  });

  it("an edit applies from the edited month onward, and earlier months keep their budget", () => {
    const { result, rerender } = renderHook(
      ({ month }) => useFinanceV2Budget({ initialVersions: versions, month, onSave }),
      { initialProps: { month: "2026-10" } }
    );

    act(() => result.current.handleAmountBlur("c1", null, "300000"));

    rerender({ month: "2026-11" });
    expect(result.current.categories[0].amount).toBe(300_000);
    rerender({ month: "2026-09" });
    expect(result.current.categories[0].amount).toBe(200_000);
    rerender({ month: "2026-08" });
    expect(result.current.categories[0].amount).toBe(100_000);
  });

  // Same tick, no re-render between calls: the second edit must build on the first
  // (the stale-closure protection the ref provides).
  it("chains successive edits in the same tick instead of dropping the first", () => {
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: seed({ categories: [] }), month: "2026-10", onSave })
    );

    act(() => {
      result.current.addCategory("Arriendo", "fixed");
      result.current.addCategory("Comida", "variable");
    });

    expect(result.current.categories.map((c) => c.name)).toEqual(["Arriendo", "Comida"]);
    expect((onSave.mock.calls[1][1] as BudgetConfig).categories).toHaveLength(2);
  });

  it("keeps a month's edits after navigating away and back", () => {
    const { result, rerender } = renderHook(
      ({ month }) => useFinanceV2Budget({ initialVersions: versions, month, onSave }),
      { initialProps: { month: "2026-10" } }
    );

    act(() => result.current.addCategory("Comida", "variable"));
    rerender({ month: "2026-08" });
    rerender({ month: "2026-10" });

    expect(result.current.categories.map((c) => c.name)).toContain("Comida");
  });
});

describe("useFinanceV2Budget", () => {
  beforeEach(() => {
    onSave.mockReset();
  });

  it("initializes categories from initialBudget and derives comparison from the budgeted amounts", () => {
    const initialBudget: BudgetConfig = {
      categories: [
        { id: "c1", name: "Arriendo", bucket: "fixed", amount: 100_000, subcategories: [] },
      ],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-07", onSave })
    );

    expect(result.current.categories).toEqual(initialBudget.categories);
    expect(result.current.comparison.rows.find((r) => r.key === "fixed")?.budgeted).toBe(100_000);
  });

  it("addCategory appends a new childless category and calls onSave once with the resulting config", () => {
    const initialBudget: BudgetConfig = { categories: [] };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-07", onSave })
    );

    act(() => result.current.addCategory("Arriendo", "fixed"));

    expect(result.current.categories).toHaveLength(1);
    expect(result.current.categories[0]).toMatchObject({
      name: "Arriendo",
      bucket: "fixed",
      amount: 0,
    });
    expect(onSave).toHaveBeenCalledOnce();
    expect((onSave.mock.calls[0][1] as BudgetConfig).categories).toHaveLength(1);
  });

  it("addCategory with a blank name does nothing and does not call onSave", () => {
    const initialBudget: BudgetConfig = { categories: [] };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-07", onSave })
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
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-07", onSave })
    );

    act(() => result.current.addSubcategory("c1", "Luz", "fixed"));

    expect(result.current.categories[0].subcategories).toHaveLength(1);
    expect(result.current.categories[0].subcategories[0]).toMatchObject({
      name: "Luz",
      bucket: "fixed",
      amount: 0,
    });
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("deleteCategory cascades and the next comparison reflects the removed leaf's bucket total", () => {
    const initialBudget: BudgetConfig = {
      categories: [
        { id: "c1", name: "Arriendo", bucket: "fixed", amount: 100_000, subcategories: [] },
      ],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-07", onSave })
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
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-07", onSave })
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
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-07", onSave })
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
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-07", onSave })
    );

    act(() => result.current.handleAmountBlur("c1", "s1", "9000"));

    expect(result.current.categories[0].subcategories[0].amount).toBe(9000);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("handleFrequencyChange makes a leaf weekly, keeps its raw amount, rescales the comparison and saves once", () => {
    const initialBudget: BudgetConfig = {
      categories: [
        { id: "c1", name: "Comida", bucket: "variable", amount: 20_000, subcategories: [] },
      ],
    };
    // 2026-08 has 5 Mondays (see `getWeeksInMonth`).
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-08", onSave })
    );

    act(() => result.current.handleFrequencyChange("c1", null, "weekly"));

    expect(result.current.categories[0]).toMatchObject({ amount: 20_000, frequency: "weekly" });
    expect(result.current.comparison.rows.find((r) => r.key === "variable")?.budgeted).toBe(
      100_000
    );
    expect(onSave).toHaveBeenCalledOnce();
    expect((onSave.mock.calls[0][1] as BudgetConfig).categories[0].frequency).toBe("weekly");
  });

  it("handleFrequencyChange sets a subcategory's frequency when subcategoryId is provided", () => {
    const initialBudget: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Hogar",
          bucket: "variable",
          amount: 0,
          subcategories: [{ id: "s1", name: "Limpieza", bucket: "variable", amount: 5000 }],
        },
      ],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-08", onSave })
    );

    act(() => result.current.handleFrequencyChange("c1", "s1", "weekly"));

    expect(result.current.categories[0].subcategories[0].frequency).toBe("weekly");
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("handleWeekdayChange rescales a weekly leaf by its new weekday and saves once", () => {
    const initialBudget: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Limpieza",
          bucket: "variable",
          amount: 20_000,
          frequency: "weekly",
          subcategories: [],
        },
      ],
    };
    // 2026-05 has 4 Mondays but 5 Sundays (weekday 0 = Sunday).
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-05", onSave })
    );
    expect(result.current.comparison.rows.find((r) => r.key === "variable")?.budgeted).toBe(80_000);

    act(() => result.current.handleWeekdayChange("c1", null, 0));

    expect(result.current.categories[0]).toMatchObject({
      amount: 20_000,
      frequency: "weekly",
      weekday: 0,
    });
    expect(result.current.comparison.rows.find((r) => r.key === "variable")?.budgeted).toBe(
      100_000
    );
    expect(onSave).toHaveBeenCalledOnce();
    expect((onSave.mock.calls[0][1] as BudgetConfig).categories[0].weekday).toBe(0);
  });

  it("handleWeekdayChange sets a subcategory's weekday when subcategoryId is provided", () => {
    const initialBudget: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Hogar",
          bucket: "variable",
          amount: 0,
          subcategories: [
            { id: "s1", name: "Limpieza", bucket: "variable", amount: 5000, frequency: "weekly" },
          ],
        },
      ],
    };
    const { result } = renderHook(() =>
      useFinanceV2Budget({ initialVersions: seed(initialBudget), month: "2026-05", onSave })
    );

    act(() => result.current.handleWeekdayChange("c1", "s1", 0));

    expect(result.current.categories[0].subcategories[0].weekday).toBe(0);
    expect(onSave).toHaveBeenCalledOnce();
  });

  // No test covers a `split`-driven comparison variant here: `computeBudgetComparison`
  // no longer accepts a `split` input, so that behavior no longer exists.

  it("derives comparison from a weekly leaf scaled by the viewed month's number of weeks", () => {
    const initialBudget: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Comida",
          bucket: "variable",
          amount: 20_000,
          frequency: "weekly",
          subcategories: [],
        },
      ],
    };
    const { result, rerender } = renderHook(
      ({ month }) => useFinanceV2Budget({ initialVersions: seed(initialBudget), month, onSave }),
      { initialProps: { month: "2026-08" } }
    );

    expect(result.current.comparison.rows.find((r) => r.key === "variable")?.budgeted).toBe(
      100_000
    );

    rerender({ month: "2026-09" });

    expect(result.current.comparison.rows.find((r) => r.key === "variable")?.budgeted).toBe(80_000);
  });
});

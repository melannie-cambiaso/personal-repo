import { describe, it, expect } from "vitest";
import { toCategoryView } from "./categoryView";
import type { BudgetCategory } from "./BudgetConfig";

// 2026-08 has 5 Mondays, 2026-09 has 4 (see `getWeeksInMonth`).
const FIVE_WEEK_MONTH = "2026-08";
const FOUR_WEEK_MONTH = "2026-09";
// 2026-05 has 5 Sundays but 4 Mondays (weekday uses `Date#getDay`: 0 = Sunday).
const FIVE_SUNDAY_MONTH = "2026-05";

describe("toCategoryView", () => {
  it("maps a childless category to a leaf view carrying its own bucket and amount", () => {
    const category: BudgetCategory = {
      id: "cat-1",
      name: "Arriendo",
      bucket: "fixed",
      amount: 350000,
      subcategories: [],
    };

    expect(toCategoryView(category, FIVE_WEEK_MONTH)).toEqual({
      kind: "leaf",
      id: "cat-1",
      name: "Arriendo",
      bucket: "fixed",
      amount: 350000,
      frequency: "monthly",
      weekday: 1,
      weeks: 5,
      monthlyAmount: 350000,
    });
  });

  it("resolves a weekly leaf's monthly amount from the weeks in the viewed month", () => {
    const category: BudgetCategory = {
      id: "cat-1",
      name: "Comida",
      bucket: "variable",
      amount: 20000,
      frequency: "weekly",
      subcategories: [],
    };

    expect(toCategoryView(category, FIVE_WEEK_MONTH)).toMatchObject({
      amount: 20000,
      frequency: "weekly",
      monthlyAmount: 100000,
    });
    expect(toCategoryView(category, FOUR_WEEK_MONTH)).toMatchObject({
      amount: 20000,
      frequency: "weekly",
      monthlyAmount: 80000,
    });
  });

  it("maps a category with subcategories to a parent view with a derived total and no amount/bucket field", () => {
    const category: BudgetCategory = {
      id: "cat-2",
      name: "Servicios",
      bucket: "fixed",
      amount: 999999, // must be ignored — never surfaces on the parent view
      subcategories: [
        { id: "sub-1", name: "Luz", bucket: "fixed", amount: 10000 },
        { id: "sub-2", name: "Agua", bucket: "variable", amount: 20000 },
      ],
    };

    const view = toCategoryView(category, FIVE_WEEK_MONTH);

    expect(view).toEqual({
      kind: "parent",
      id: "cat-2",
      name: "Servicios",
      defaultBucket: "fixed",
      total: 30000,
      subcategories: [
        { id: "sub-1", name: "Luz", bucket: "fixed", amount: 10000, frequency: "monthly", weekday: 1, weeks: 5, monthlyAmount: 10000 },
        { id: "sub-2", name: "Agua", bucket: "variable", amount: 20000, frequency: "monthly", weekday: 1, weeks: 5, monthlyAmount: 20000 },
      ],
    });
    expect(view).not.toHaveProperty("amount");
    expect(view).not.toHaveProperty("bucket");
  });

  it("sums a parent's total from month-resolved subcategory amounts, not raw weekly figures", () => {
    const category: BudgetCategory = {
      id: "cat-3",
      name: "Hogar",
      bucket: "variable",
      amount: 0,
      subcategories: [
        { id: "sub-1", name: "Limpieza", bucket: "variable", amount: 5000, frequency: "weekly" },
        { id: "sub-2", name: "Internet", bucket: "fixed", amount: 30000, frequency: "monthly" },
      ],
    };

    const fiveWeeks = toCategoryView(category, FIVE_WEEK_MONTH);
    const fourWeeks = toCategoryView(category, FOUR_WEEK_MONTH);

    expect(fiveWeeks).toMatchObject({ kind: "parent", total: 55000 });
    expect(fourWeeks).toMatchObject({ kind: "parent", total: 50000 });
    expect(fiveWeeks.kind === "parent" && fiveWeeks.subcategories[0]).toMatchObject({
      amount: 5000,
      frequency: "weekly",
      monthlyAmount: 25000,
    });
  });

  it("resolves weeks from each leaf's own weekday, defaulting to Monday", () => {
    const sundayLeaf: BudgetCategory = {
      id: "cat-4",
      name: "Limpieza",
      bucket: "variable",
      amount: 20000,
      frequency: "weekly",
      weekday: 0,
      subcategories: [],
    };
    const parent: BudgetCategory = {
      id: "cat-5",
      name: "Hogar",
      bucket: "variable",
      amount: 0,
      subcategories: [
        { id: "sub-1", name: "Limpieza", bucket: "variable", amount: 5000, frequency: "weekly", weekday: 0 },
        { id: "sub-2", name: "Comida", bucket: "variable", amount: 10000, frequency: "weekly" },
      ],
    };

    expect(toCategoryView(sundayLeaf, FIVE_SUNDAY_MONTH)).toMatchObject({
      weekday: 0,
      weeks: 5,
      monthlyAmount: 100000,
    });

    const view = toCategoryView(parent, FIVE_SUNDAY_MONTH);
    expect(view.kind === "parent" && view.subcategories).toMatchObject([
      { weekday: 0, weeks: 5, monthlyAmount: 25000 },
      { weekday: 1, weeks: 4, monthlyAmount: 40000 },
    ]);
    expect(view).toMatchObject({ total: 65000 });
  });
});

import { describe, it, expect } from "vitest";
import { listExpenseCategoryOptions } from "./expenseCategoryOptions";
import type { BudgetConfig } from "./BudgetConfig";

describe("listExpenseCategoryOptions", () => {
  it("returns an empty list for an empty budget", () => {
    expect(listExpenseCategoryOptions({ categories: [] })).toEqual([]);
  });

  it("includes a childless category as a directly pickable option", () => {
    const budget: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 0, subcategories: [] }],
    };

    expect(listExpenseCategoryOptions(budget)).toEqual([
      { id: "c1", name: "Arriendo", bucket: "fixed" },
    ]);
  });

  it("flattens a parent category's subcategories instead of the parent itself", () => {
    const budget: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Servicios",
          bucket: "fixed",
          amount: 0,
          subcategories: [
            { id: "s1", name: "Luz", bucket: "fixed", amount: 5000 },
            { id: "s2", name: "Internet", bucket: "variable", amount: 20000 },
          ],
        },
      ],
    };

    expect(listExpenseCategoryOptions(budget)).toEqual([
      { id: "s1", name: "Luz", bucket: "fixed" },
      { id: "s2", name: "Internet", bucket: "variable" },
    ]);
  });

  it("EXCLUDES bucket:savings leaves — a savings-bucketed leaf cannot back an expense (structural guard)", () => {
    const budget: BudgetConfig = {
      categories: [
        { id: "c1", name: "Ahorro emergencia", bucket: "savings", amount: 0, subcategories: [] },
        {
          id: "c2",
          name: "Servicios",
          bucket: "fixed",
          amount: 0,
          subcategories: [
            { id: "s1", name: "Luz", bucket: "fixed", amount: 5000 },
            { id: "s2", name: "Fondo ahorro", bucket: "savings", amount: 10000 },
          ],
        },
      ],
    };

    const options = listExpenseCategoryOptions(budget);

    expect(options).toEqual([{ id: "s1", name: "Luz", bucket: "fixed" }]);
    expect(options.some((o) => o.id === "c1")).toBe(false);
    expect(options.some((o) => o.id === "s2")).toBe(false);
  });
});

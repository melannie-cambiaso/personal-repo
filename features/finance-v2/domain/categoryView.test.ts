import { describe, it, expect } from "vitest";
import { toCategoryView } from "./categoryView";
import type { BudgetCategory } from "./BudgetConfig";

describe("toCategoryView", () => {
  it("maps a childless category to a leaf view carrying its own bucket and amount", () => {
    const category: BudgetCategory = {
      id: "cat-1",
      name: "Arriendo",
      bucket: "fixed",
      amount: 350000,
      subcategories: [],
    };

    expect(toCategoryView(category)).toEqual({
      kind: "leaf",
      id: "cat-1",
      name: "Arriendo",
      bucket: "fixed",
      amount: 350000,
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

    const view = toCategoryView(category);

    expect(view).toEqual({
      kind: "parent",
      id: "cat-2",
      name: "Servicios",
      defaultBucket: "fixed",
      total: 30000,
      subcategories: category.subcategories,
    });
    expect(view).not.toHaveProperty("amount");
    expect(view).not.toHaveProperty("bucket");
  });
});

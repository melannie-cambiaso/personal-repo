import { describe, it, expect } from "vitest";
import {
  addCategory,
  addSubcategory,
  deleteCategory,
  deleteSubcategory,
  setLeafAmount,
} from "./budgetMutations";
import type { BudgetConfig } from "./BudgetConfig";

describe("addCategory", () => {
  it("appends a new childless category", () => {
    const config: BudgetConfig = { categories: [] };

    const next = addCategory(config, { id: "c1", name: "Arriendo", bucket: "fixed" });

    expect(next).toEqual({
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 0, subcategories: [] }],
    });
    expect(config).toEqual({ categories: [] }); // input untouched
  });
});

describe("addSubcategory", () => {
  it("appends a subcategory under the matching category id", () => {
    const config: BudgetConfig = {
      categories: [
        { id: "c1", name: "Servicios", bucket: "fixed", amount: 0, subcategories: [] },
        { id: "c2", name: "Ocio", bucket: "variable", amount: 20000, subcategories: [] },
      ],
    };

    const next = addSubcategory(config, {
      categoryId: "c1",
      id: "s1",
      name: "Luz",
      bucket: "fixed",
    });

    expect(next.categories.find((c) => c.id === "c1")?.subcategories).toEqual([
      { id: "s1", name: "Luz", bucket: "fixed", amount: 0 },
    ]);
    expect(next.categories.find((c) => c.id === "c2")).toEqual(config.categories[1]);
    expect(config.categories[0].subcategories).toEqual([]); // input untouched
  });
});

describe("deleteCategory", () => {
  it("cascades — removes the category and all of its subcategories, leaving unrelated categories untouched", () => {
    const config: BudgetConfig = {
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
        { id: "c2", name: "Ocio", bucket: "variable", amount: 20000, subcategories: [] },
      ],
    };

    const next = deleteCategory(config, "c1");

    expect(next.categories).toEqual([config.categories[1]]);
  });
});

describe("deleteSubcategory", () => {
  it("removes only the targeted subcategory, leaving siblings intact", () => {
    const config: BudgetConfig = {
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

    const next = deleteSubcategory(config, { categoryId: "c1", id: "s1" });

    expect(next.categories[0].subcategories).toEqual([
      { id: "s2", name: "Agua", bucket: "fixed", amount: 3000 },
    ]);
  });
});

describe("setLeafAmount", () => {
  it("sets a childless category's amount when subcategoryId is null", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 0, subcategories: [] }],
    };

    const next = setLeafAmount(config, { categoryId: "c1", subcategoryId: null, amount: 350000 });

    expect(next.categories[0].amount).toBe(350000);
  });

  it("sets a subcategory's amount when subcategoryId is provided", () => {
    const config: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Servicios",
          bucket: "fixed",
          amount: 0,
          subcategories: [{ id: "s1", name: "Luz", bucket: "fixed", amount: 5000 }],
        },
      ],
    };

    const next = setLeafAmount(config, { categoryId: "c1", subcategoryId: "s1", amount: 9000 });

    expect(next.categories[0].subcategories[0].amount).toBe(9000);
  });

  it("returns the config unchanged (no throw) when the category id is unknown", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 0, subcategories: [] }],
    };

    const next = setLeafAmount(config, { categoryId: "missing", subcategoryId: null, amount: 1000 });

    expect(next).toEqual(config);
  });

  it("returns a new object rather than mutating the input", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 0, subcategories: [] }],
    };

    const next = setLeafAmount(config, { categoryId: "c1", subcategoryId: null, amount: 500 });

    expect(next).not.toBe(config);
    expect(config.categories[0].amount).toBe(0);
  });
});

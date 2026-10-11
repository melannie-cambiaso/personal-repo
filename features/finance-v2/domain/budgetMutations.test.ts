import { describe, it, expect } from "vitest";
import {
  addCategory,
  addIncomeSource,
  addSubcategory,
  deleteCategory,
  deleteIncomeSource,
  deleteSubcategory,
  renameCategory,
  renameIncomeSource,
  renameSubcategory,
  setIncomeSourceAmount,
  setLeafAmount,
  setLeafFrequency,
  setLeafWeekday,
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

    const next = setLeafAmount(config, {
      categoryId: "missing",
      subcategoryId: null,
      amount: 1000,
    });

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

describe("setLeafFrequency", () => {
  it("sets a childless category's frequency when subcategoryId is null", () => {
    const config: BudgetConfig = {
      categories: [
        { id: "c1", name: "Comida", bucket: "variable", amount: 20000, subcategories: [] },
      ],
    };

    const next = setLeafFrequency(config, {
      categoryId: "c1",
      subcategoryId: null,
      frequency: "weekly",
    });

    expect(next.categories[0].frequency).toBe("weekly");
    expect(config.categories[0].frequency).toBeUndefined(); // input untouched
  });

  it("sets a subcategory's frequency when subcategoryId is provided", () => {
    const config: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Servicios",
          bucket: "fixed",
          amount: 0,
          subcategories: [{ id: "s1", name: "Limpieza", bucket: "fixed", amount: 5000 }],
        },
      ],
    };

    const next = setLeafFrequency(config, {
      categoryId: "c1",
      subcategoryId: "s1",
      frequency: "weekly",
    });

    expect(next.categories[0].subcategories[0].frequency).toBe("weekly");
  });

  it("returns the config unchanged (no throw) when the category id is unknown", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 0, subcategories: [] }],
    };

    const next = setLeafFrequency(config, {
      categoryId: "missing",
      subcategoryId: null,
      frequency: "weekly",
    });

    expect(next).toEqual(config);
  });
});

// weekday uses `Date#getDay` numbering: 0 = Sunday.
describe("setLeafWeekday", () => {
  it("sets a childless category's weekday when subcategoryId is null, keeping amount and frequency", () => {
    const config: BudgetConfig = {
      categories: [
        {
          id: "c1",
          name: "Limpieza",
          bucket: "variable",
          amount: 20000,
          frequency: "weekly",
          subcategories: [],
        },
      ],
    };

    const next = setLeafWeekday(config, { categoryId: "c1", subcategoryId: null, weekday: 0 });

    expect(next.categories[0]).toMatchObject({ amount: 20000, frequency: "weekly", weekday: 0 });
    expect(config.categories[0].weekday).toBeUndefined(); // input untouched
  });

  it("sets a subcategory's weekday when subcategoryId is provided", () => {
    const config: BudgetConfig = {
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

    const next = setLeafWeekday(config, { categoryId: "c1", subcategoryId: "s1", weekday: 0 });

    expect(next.categories[0].subcategories[0].weekday).toBe(0);
  });

  it("returns the config unchanged (no throw) when the category id is unknown", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Arriendo", bucket: "fixed", amount: 0, subcategories: [] }],
    };

    const next = setLeafWeekday(config, { categoryId: "missing", subcategoryId: null, weekday: 0 });

    expect(next).toEqual(config);
  });
});

// Every category edit must carry the income sources through: a mutation that rebuilt
// the config from `categories` alone would silently delete them on the next save.
describe("category edits keep the income sources", () => {
  const withSources: BudgetConfig = {
    categories: [
      {
        id: "c1",
        name: "Servicios",
        bucket: "fixed",
        amount: 0,
        subcategories: [{ id: "s1", name: "Luz", bucket: "fixed", amount: 10 }],
      },
    ],
    incomeSources: [{ id: "i1", name: "Sueldo", amount: 1_500_000 }],
  };

  const edits: [string, (c: BudgetConfig) => BudgetConfig][] = [
    ["addCategory", (c) => addCategory(c, { id: "c2", name: "Comida", bucket: "variable" })],
    [
      "addSubcategory",
      (c) => addSubcategory(c, { categoryId: "c1", id: "s2", name: "Agua", bucket: "fixed" }),
    ],
    ["deleteCategory", (c) => deleteCategory(c, "c1")],
    ["deleteSubcategory", (c) => deleteSubcategory(c, { categoryId: "c1", id: "s1" })],
    [
      "setLeafAmount",
      (c) => setLeafAmount(c, { categoryId: "c1", subcategoryId: "s1", amount: 5 }),
    ],
    [
      "setLeafFrequency",
      (c) => setLeafFrequency(c, { categoryId: "c1", subcategoryId: "s1", frequency: "weekly" }),
    ],
    [
      "setLeafWeekday",
      (c) => setLeafWeekday(c, { categoryId: "c1", subcategoryId: "s1", weekday: 3 }),
    ],
    ["renameCategory", (c) => renameCategory(c, { categoryId: "c1", name: "Casa" })],
    [
      "renameSubcategory",
      (c) => renameSubcategory(c, { categoryId: "c1", id: "s1", name: "Gas" }),
    ],
  ];

  it.each(edits)("%s keeps incomeSources", (_name, edit) => {
    expect(edit(withSources).incomeSources).toEqual(withSources.incomeSources);
  });
});

describe("addIncomeSource", () => {
  it("appends a source with amount 0, creating the list when absent", () => {
    const config: BudgetConfig = { categories: [] };

    const next = addIncomeSource(config, { id: "i1", name: "Sueldo" });

    expect(next).toEqual({ categories: [], incomeSources: [{ id: "i1", name: "Sueldo", amount: 0 }] });
    expect(config).toEqual({ categories: [] }); // input untouched
  });

  it("appends after the existing sources and keeps the categories", () => {
    const config: BudgetConfig = {
      categories: [{ id: "c1", name: "Renta", bucket: "fixed", amount: 1, subcategories: [] }],
      incomeSources: [{ id: "i1", name: "Sueldo", amount: 100 }],
    };

    const next = addIncomeSource(config, { id: "i2", name: "Freelance" });

    expect(next.categories).toBe(config.categories);
    expect(next.incomeSources).toEqual([
      { id: "i1", name: "Sueldo", amount: 100 },
      { id: "i2", name: "Freelance", amount: 0 },
    ]);
  });
});

describe("income source edits", () => {
  const config: BudgetConfig = {
    categories: [],
    incomeSources: [
      { id: "i1", name: "Sueldo", amount: 100 },
      { id: "i2", name: "Freelance", amount: 50 },
    ],
  };

  it("renameIncomeSource renames only the matching source", () => {
    expect(renameIncomeSource(config, { id: "i2", name: "Clases" }).incomeSources).toEqual([
      { id: "i1", name: "Sueldo", amount: 100 },
      { id: "i2", name: "Clases", amount: 50 },
    ]);
  });

  it("setIncomeSourceAmount sets only the matching source's amount", () => {
    expect(setIncomeSourceAmount(config, { id: "i1", amount: 900 }).incomeSources).toEqual([
      { id: "i1", name: "Sueldo", amount: 900 },
      { id: "i2", name: "Freelance", amount: 50 },
    ]);
  });

  it("deleteIncomeSource removes only the matching source", () => {
    expect(deleteIncomeSource(config, "i1").incomeSources).toEqual([
      { id: "i2", name: "Freelance", amount: 50 },
    ]);
  });

  it("unknown ids leave the sources unchanged", () => {
    expect(renameIncomeSource(config, { id: "x", name: "y" })).toEqual(config);
    expect(setIncomeSourceAmount(config, { id: "x", amount: 1 })).toEqual(config);
    expect(deleteIncomeSource(config, "x")).toEqual(config);
  });

  it("edits on a config without sources leave it without sources", () => {
    const bare: BudgetConfig = { categories: [] };
    expect(renameIncomeSource(bare, { id: "x", name: "y" })).toEqual(bare);
    expect(setIncomeSourceAmount(bare, { id: "x", amount: 1 })).toEqual(bare);
    expect(deleteIncomeSource(bare, "x")).toEqual(bare);
  });

  it("never mutates the input", () => {
    const snapshot = structuredClone(config);
    renameIncomeSource(config, { id: "i1", name: "z" });
    setIncomeSourceAmount(config, { id: "i1", amount: 1 });
    deleteIncomeSource(config, "i1");
    expect(config).toEqual(snapshot);
  });
});

import { describe, it, expect } from "vitest";
import type { BudgetConfig } from "./BudgetConfig";
import { DEFAULT_BUDGET_CONFIG } from "./BudgetConfig";
import type { BudgetVersion } from "./budgetVersions";
import {
  isValidBudgetConfig,
  isValidBudgetVersion,
  resolveBudgetForMonth,
  upsertBudgetVersion,
} from "./budgetVersions";

const configNamed = (name: string): BudgetConfig => ({
  categories: [{ id: name, name, bucket: "fixed", amount: 100, subcategories: [] }],
});

const version = (effectiveFrom: string, name: string): BudgetVersion => ({
  effectiveFrom,
  config: configNamed(name),
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const NOW = "2026-10-06T12:00:00.000Z";

describe("resolveBudgetForMonth", () => {
  const versions = [version("0000-00", "legacy"), version("2026-08", "aug"), version("2026-11", "nov")];

  it("returns the version effective exactly in that month", () => {
    expect(resolveBudgetForMonth(versions, "2026-08")).toEqual(configNamed("aug"));
  });

  it("returns the latest earlier version for a month in a gap", () => {
    expect(resolveBudgetForMonth(versions, "2026-10")).toEqual(configNamed("aug"));
  });

  it("returns the legacy version for months before every dated version", () => {
    expect(resolveBudgetForMonth(versions, "2025-03")).toEqual(configNamed("legacy"));
  });

  it("returns the last version for months after it", () => {
    expect(resolveBudgetForMonth(versions, "2027-02")).toEqual(configNamed("nov"));
  });

  it("does not depend on the input order", () => {
    expect(resolveBudgetForMonth([...versions].reverse(), "2026-10")).toEqual(configNamed("aug"));
  });

  it("returns the default config when no version applies", () => {
    expect(resolveBudgetForMonth([version("2026-08", "aug")], "2026-07")).toBe(
      DEFAULT_BUDGET_CONFIG
    );
    expect(resolveBudgetForMonth([], "2026-07")).toBe(DEFAULT_BUDGET_CONFIG);
  });
});

describe("upsertBudgetVersion", () => {
  it("inserts a new version for the month, keeping the list sorted", () => {
    const result = upsertBudgetVersion(
      [version("0000-00", "legacy"), version("2026-11", "nov")],
      "2026-10",
      configNamed("oct"),
      NOW
    );
    expect(result.map((v) => v.effectiveFrom)).toEqual(["0000-00", "2026-10", "2026-11"]);
    expect(result[1]).toEqual({ effectiveFrom: "2026-10", config: configNamed("oct"), updatedAt: NOW });
  });

  it("replaces the version already effective in that month", () => {
    const result = upsertBudgetVersion(
      [version("0000-00", "legacy"), version("2026-10", "old")],
      "2026-10",
      configNamed("new"),
      NOW
    );
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ effectiveFrom: "2026-10", config: configNamed("new"), updatedAt: NOW });
  });

  it("leaves earlier and later versions untouched", () => {
    const legacy = version("0000-00", "legacy");
    const nov = version("2026-11", "nov");
    const result = upsertBudgetVersion([legacy, nov], "2026-10", configNamed("oct"), NOW);
    expect(result[0]).toBe(legacy);
    expect(result[2]).toBe(nov);
  });

  it("does not mutate the input list", () => {
    const input = [version("0000-00", "legacy")];
    upsertBudgetVersion(input, "2026-10", configNamed("oct"), NOW);
    expect(input).toHaveLength(1);
  });
});

// Stored values come back from redis untyped, so every field the UI and the rollups
// read is checked at runtime.
describe("isValidBudgetVersion", () => {
  const fullVersion = () => ({
    effectiveFrom: "2026-10",
    updatedAt: "2026-10-01T00:00:00.000Z",
    config: {
      categories: [
        { id: "c1", name: "Renta", bucket: "fixed", amount: 500_000, subcategories: [] },
        {
          id: "c2",
          name: "Comida",
          bucket: "variable",
          amount: 0,
          frequency: "monthly",
          subcategories: [
            {
              id: "s1",
              name: "Feria",
              bucket: "variable",
              amount: 20_000,
              frequency: "weekly",
              weekday: 6,
            },
            { id: "s2", name: "Super", bucket: "savings", amount: 1.5, frequency: "monthly" },
          ],
        },
      ],
    },
  });

  it("accepts a complete version, optional fields included", () => {
    expect(isValidBudgetVersion(fullVersion())).toBe(true);
  });

  it("accepts the legacy 0000-00 version and an empty config", () => {
    expect(
      isValidBudgetVersion({ effectiveFrom: "0000-00", updatedAt: "x", config: { categories: [] } })
    ).toBe(true);
  });

  type Version = ReturnType<typeof fullVersion>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Breaker = (v: any) => void;
  const cases: [string, Breaker][] = [
    ["effectiveFrom is missing", (v) => delete v.effectiveFrom],
    ["effectiveFrom is not YYYY-MM", (v) => (v.effectiveFrom = "2026-1")],
    ["updatedAt is not a string", (v) => (v.updatedAt = 123)],
    ["config is null", (v) => (v.config = null)],
    ["categories is not a list", (v) => (v.config.categories = "x")],
    ["a category is null", (v) => (v.config.categories[0] = null)],
    ["a category id is not a string", (v) => (v.config.categories[0].id = 1)],
    ["a category name is not a string", (v) => (v.config.categories[0].name = undefined)],
    ["a category bucket is unknown", (v) => (v.config.categories[0].bucket = "other")],
    ["a category amount is a string", (v) => (v.config.categories[0].amount = "500")],
    ["a category amount is NaN", (v) => (v.config.categories[0].amount = NaN)],
    ["a category amount is Infinity", (v) => (v.config.categories[0].amount = Infinity)],
    ["a category frequency is unknown", (v) => (v.config.categories[0].frequency = "daily")],
    ["a category weekday is 7", (v) => (v.config.categories[0].weekday = 7)],
    ["subcategories is not a list", (v) => (v.config.categories[0].subcategories = null)],
    ["a subcategory is null", (v) => (v.config.categories[1].subcategories[0] = null)],
    ["a subcategory bucket is unknown", (v) => (v.config.categories[1].subcategories[0].bucket = 2)],
    ["a subcategory amount is NaN", (v) => (v.config.categories[1].subcategories[0].amount = NaN)],
    ["a subcategory weekday is not whole", (v) => (v.config.categories[1].subcategories[0].weekday = 1.5)],
    ["a subcategory weekday is negative", (v) => (v.config.categories[1].subcategories[0].weekday = -1)],
    ["a subcategory frequency is unknown", (v) => (v.config.categories[1].subcategories[1].frequency = "yearly")],
  ];

  it.each(cases)("rejects a version where %s", (_label, breakIt) => {
    const v: Version = fullVersion();
    breakIt(v);
    expect(isValidBudgetVersion(v)).toBe(false);
  });

  it.each([null, undefined, "x", 42, []])("rejects a non-object value %j", (value) => {
    expect(isValidBudgetVersion(value)).toBe(false);
  });
});

describe("isValidBudgetConfig", () => {
  it("accepts a config with categories", () => {
    expect(isValidBudgetConfig(configNamed("rent"))).toBe(true);
  });

  it("accepts a config with income sources, and one with an empty list", () => {
    const sources = [
      { id: "i1", name: "Sueldo", amount: 1_500_000 },
      { id: "i2", name: "Freelance", amount: 0 },
    ];
    expect(isValidBudgetConfig({ categories: [], incomeSources: sources })).toBe(true);
    expect(isValidBudgetConfig({ categories: [], incomeSources: [] })).toBe(true);
  });

  it.each([
    ["incomeSources is not a list", { incomeSources: "x" }],
    ["incomeSources is null", { incomeSources: null }],
    ["a source is null", { incomeSources: [null] }],
    ["a source id is not a string", { incomeSources: [{ id: 1, name: "a", amount: 1 }] }],
    ["a source name is missing", { incomeSources: [{ id: "i1", amount: 1 }] }],
    ["a source amount is a string", { incomeSources: [{ id: "i1", name: "a", amount: "1" }] }],
    ["a source amount is NaN", { incomeSources: [{ id: "i1", name: "a", amount: NaN }] }],
    ["a source amount is Infinity", { incomeSources: [{ id: "i1", name: "a", amount: Infinity }] }],
  ])("rejects a config where %s", (_label, extra) => {
    expect(isValidBudgetConfig({ categories: [], ...extra })).toBe(false);
  });

  it.each([null, {}, { categories: "x" }, { categories: [{ id: "c1" }] }])(
    "rejects %j",
    (value) => {
      expect(isValidBudgetConfig(value)).toBe(false);
    }
  );
});

import { describe, it, expect } from "vitest";
import type { BudgetConfig } from "./BudgetConfig";
import { DEFAULT_BUDGET_CONFIG } from "./BudgetConfig";
import type { BudgetVersion } from "./budgetVersions";
import { resolveBudgetForMonth, upsertBudgetVersion } from "./budgetVersions";

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

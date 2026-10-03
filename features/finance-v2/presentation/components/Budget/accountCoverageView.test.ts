import { describe, it, expect } from "vitest";
import type { BudgetCategory, EnvelopeConfig } from "@/features/finance-v2/domain";
import { toAccountCoverageView } from "./accountCoverageView";

const envelope: EnvelopeConfig = {
  name: "Servicios",
  boundCategoryId: "cuentas",
  openingBalance: 0,
  openingMonth: "2026-07",
};

const categories: BudgetCategory[] = [
  { id: "cuentas", name: "Cuentas", bucket: "fixed", amount: 0, subcategories: [] },
];

const base = { isLoadingMonth: false, pending: 10_000, balance: 25_000, envelope, categories };

describe("toAccountCoverageView", () => {
  it("carries the figures once the month has loaded", () => {
    expect(toAccountCoverageView(base).figures).toEqual({ pending: 10_000, balance: 25_000 });
  });

  // Design D7: figures computed against the previous month's transactions mid-load
  // must never reach the screen.
  it("withholds the figures while the month is loading", () => {
    expect(toAccountCoverageView({ ...base, isLoadingMonth: true }).figures).toBeNull();
  });

  it("names the bound category and the envelope", () => {
    expect(toAccountCoverageView(base).envelopeNote).toEqual({
      categoryName: "Cuentas",
      envelopeName: "Servicios",
    });
  });

  it("has no note when no envelope is configured", () => {
    expect(toAccountCoverageView({ ...base, envelope: null }).envelopeNote).toBeNull();
  });

  // Mirrors `computePendingFromMain`: a bound category missing from the budget
  // excludes nothing, so there is nothing to note.
  it("has no note when the bound category no longer exists", () => {
    expect(toAccountCoverageView({ ...base, categories: [] }).envelopeNote).toBeNull();
  });
});

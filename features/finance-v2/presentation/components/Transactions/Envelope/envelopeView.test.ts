import { describe, it, expect } from "vitest";
import { toEnvelopeView } from "./envelopeView";
import type { BudgetConfig, EnvelopeConfig, FinanceV2Transaction } from "@/features/finance-v2/domain";

const config: EnvelopeConfig = {
  name: "Servicios",
  boundCategoryId: "cuentas",
  openingBalance: 30_000,
  openingMonth: "2026-10",
};

const budget: BudgetConfig = {
  categories: [
    {
      id: "cuentas",
      name: "Cuentas",
      bucket: "fixed",
      amount: 0,
      subcategories: [
        { id: "luz", name: "Luz", bucket: "fixed", amount: 43_000 },
        { id: "agua", name: "Agua", bucket: "fixed", amount: 73_000 },
      ],
    },
  ],
};

const transactions: FinanceV2Transaction[] = [
  { id: "t1", type: "transfer", amount: 116_000, date: "2026-10-01", month: "2026-10" },
  {
    id: "t2",
    type: "expense",
    amount: 43_000,
    date: "2026-10-05",
    month: "2026-10",
    bucket: "fixed",
    category: { id: "luz", name: "Luz" },
    paidFrom: "envelope",
  },
  {
    id: "t3",
    type: "expense",
    amount: 20_000,
    date: "2026-10-06",
    month: "2026-10",
    bucket: "variable",
    category: null,
  },
];

const base = { config, carriedIn: 7_000, isLoading: false, transactions, budget, month: "2026-10" };

describe("toEnvelopeView", () => {
  it("is null when no envelope is configured", () => {
    expect(toEnvelopeView({ ...base, config: null })).toBeNull();
  });

  it("carries the config, the carried-in balance, the viewed month's flows and the suggestion", () => {
    expect(toEnvelopeView(base)).toEqual({
      config,
      carriedIn: 7_000,
      flows: { transferred: 116_000, paid: 43_000 },
      suggestedTransfer: 116_000,
    });
  });

  it("folds loading into a null carried-in so the card and reminder hide without knowing about loading", () => {
    expect(toEnvelopeView({ ...base, isLoading: true })?.carriedIn).toBeNull();
  });

  it("keeps a null carried-in for a month before the envelope existed", () => {
    expect(toEnvelopeView({ ...base, carriedIn: null })?.carriedIn).toBeNull();
  });

  it("reports a null suggestion when the bound category no longer exists", () => {
    expect(toEnvelopeView({ ...base, budget: { categories: [] } })?.suggestedTransfer).toBeNull();
  });
});

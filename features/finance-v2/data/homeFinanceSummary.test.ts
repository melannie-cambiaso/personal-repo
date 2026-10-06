import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  BudgetConfig,
  EnvelopeConfig,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";

const loadBudgetVersionsMock = vi.hoisted(() => vi.fn());
const loadTransactionsMock = vi.hoisted(() => vi.fn());
const loadEnvelopeConfigMock = vi.hoisted(() => vi.fn());

vi.mock("./kvAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kvAdapter")>();
  return {
    ...actual,
    loadBudgetVersions: loadBudgetVersionsMock,
    loadTransactions: loadTransactionsMock,
    loadEnvelopeConfig: loadEnvelopeConfigMock,
  };
});

import { loadHomeFinanceSummary } from "./homeFinanceSummary";

const MONTH = "2026-10";

// Leaves: rent 1000 (fixed), groceries 400 (variable), electricity 150 (fixed, under the
// envelope-bound "bills" category). Full monthly budget = 1550.
const budget: BudgetConfig = {
  categories: [
    { id: "rent", name: "Renta", bucket: "fixed", amount: 1000, subcategories: [] },
    {
      id: "food",
      name: "Comida",
      bucket: "variable",
      amount: 0,
      subcategories: [{ id: "groceries", name: "Super", bucket: "variable", amount: 400 }],
    },
    {
      id: "bills",
      name: "Cuentas",
      bucket: "fixed",
      amount: 0,
      subcategories: [{ id: "electricity", name: "Luz", bucket: "fixed", amount: 150 }],
    },
  ],
};

const envelope: EnvelopeConfig = {
  name: "Servicios",
  boundCategoryId: "bills",
  openingBalance: 0,
  openingMonth: MONTH,
};

const base = { date: "2026-10-05", month: MONTH };
const income: FinanceV2Transaction = { ...base, id: "t1", type: "income", amount: 3000 };
const rent: FinanceV2Transaction = {
  ...base,
  id: "t2",
  type: "expense",
  amount: 1000,
  bucket: "fixed",
  category: { id: "rent", name: "Renta" },
};
const groceries: FinanceV2Transaction = {
  ...base,
  id: "t3",
  type: "expense",
  amount: 150,
  bucket: "variable",
  category: { id: "groceries", name: "Super" },
};
const savings: FinanceV2Transaction = { ...base, id: "t4", type: "savings", amount: 200 };
const transfer: FinanceV2Transaction = { ...base, id: "t5", type: "transfer", amount: 120 };
const envelopeBill: FinanceV2Transaction = {
  ...base,
  id: "t6",
  type: "expense",
  amount: 100,
  bucket: "fixed",
  category: { id: "electricity", name: "Luz" },
  paidFrom: "envelope",
};

describe("loadHomeFinanceSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadBudgetVersionsMock.mockResolvedValue([
      { effectiveFrom: "0000-00", config: budget, updatedAt: "2026-09-01T00:00:00.000Z" },
    ]);
  });

  it("uses the budget version in force for the month, not a later one", async () => {
    loadBudgetVersionsMock.mockResolvedValue([
      { effectiveFrom: "0000-00", config: budget, updatedAt: "2026-09-01T00:00:00.000Z" },
      // A later edit must not leak back into this month's pending.
      { effectiveFrom: "2026-11", config: { categories: [] }, updatedAt: "2026-11-01T00:00:00.000Z" },
    ]);
    loadTransactionsMock.mockResolvedValue([]);
    loadEnvelopeConfigMock.mockResolvedValue(null);

    const result = await loadHomeFinanceSummary(MONTH);

    expect(result.pending).toBe(1550);
  });

  it("uses the version that starts in the month itself", async () => {
    loadBudgetVersionsMock.mockResolvedValue([
      { effectiveFrom: "0000-00", config: budget, updatedAt: "2026-09-01T00:00:00.000Z" },
      { effectiveFrom: MONTH, config: { categories: [] }, updatedAt: "2026-10-01T00:00:00.000Z" },
    ]);
    loadTransactionsMock.mockResolvedValue([]);
    loadEnvelopeConfigMock.mockResolvedValue(null);

    const result = await loadHomeFinanceSummary(MONTH);

    expect(result.pending).toBe(0);
  });

  it("returns the month balance and pending from the main account, excluding the envelope", async () => {
    loadTransactionsMock.mockResolvedValue([
      income,
      rent,
      groceries,
      savings,
      transfer,
      envelopeBill,
    ]);
    loadEnvelopeConfigMock.mockResolvedValue(envelope);

    const result = await loadHomeFinanceSummary(MONTH);

    // 3000 − (1000 + 150) − 200 − 120; the envelope-paid bill never touches the main account.
    // Pending: rent 0 + groceries 250; the envelope's electricity leaf is excluded.
    expect(result).toEqual({ month: MONTH, balance: 1530, pending: 250 });
    expect(loadTransactionsMock).toHaveBeenCalledWith(MONTH);
  });

  it("counts every leaf as pending from the main account when there is no envelope", async () => {
    loadTransactionsMock.mockResolvedValue([income, rent, groceries, savings, transfer]);
    loadEnvelopeConfigMock.mockResolvedValue(null);

    const result = await loadHomeFinanceSummary(MONTH);

    // Pending: rent 0 + groceries 250 + electricity 150.
    expect(result).toEqual({ month: MONTH, balance: 1530, pending: 400 });
  });

  it("returns a zero balance and the full budget as pending for an empty month", async () => {
    loadTransactionsMock.mockResolvedValue([]);
    loadEnvelopeConfigMock.mockResolvedValue(null);

    const result = await loadHomeFinanceSummary(MONTH);

    expect(result).toEqual({ month: MONTH, balance: 0, pending: 1550 });
  });
});

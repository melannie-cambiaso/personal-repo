import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  BudgetConfig,
  EnvelopeConfig,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const saveBudgetConfigMock = vi.hoisted(() => vi.fn());
const saveTransactionsMock = vi.hoisted(() => vi.fn());
const appendTransactionToMonthMock = vi.hoisted(() => vi.fn());
const loadTransactionsMock = vi.hoisted(() => vi.fn());
const saveEnvelopeConfigMock = vi.hoisted(() => vi.fn());
const loadEnvelopeConfigMock = vi.hoisted(() => vi.fn());
const loadTransactionsForMonthsMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: () => ({ get: cookiesGetMock }),
}));
vi.mock("./kvAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kvAdapter")>();
  return {
    ...actual,
    saveBudgetConfig: saveBudgetConfigMock,
    saveTransactions: saveTransactionsMock,
    appendTransactionToMonth: appendTransactionToMonthMock,
    loadTransactions: loadTransactionsMock,
    saveEnvelopeConfig: saveEnvelopeConfigMock,
    loadEnvelopeConfig: loadEnvelopeConfigMock,
    loadTransactionsForMonths: loadTransactionsForMonthsMock,
  };
});

import {
  handleSaveBudgetConfig,
  handleSaveTransactions,
  handleAppendTransactionToMonth,
  handleLoadTransactions,
  handleSaveEnvelopeConfig,
  handleLoadEnvelopeCarriedBalance,
} from "./financeV2Actions";

const withAuth = () => cookiesGetMock.mockReturnValue({ value: "token" });
const withoutAuth = () => cookiesGetMock.mockReturnValue(undefined);

describe("handleSaveBudgetConfig", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth and does not write KV", async () => {
    withoutAuth();
    const budget: BudgetConfig = { categories: [] };
    await handleSaveBudgetConfig(budget);
    expect(saveBudgetConfigMock).not.toHaveBeenCalled();
  });

  it("delegates to kvAdapter when authenticated", async () => {
    withAuth();
    const budget: BudgetConfig = { categories: [] };
    await handleSaveBudgetConfig(budget);
    expect(saveBudgetConfigMock).toHaveBeenCalledWith(budget);
  });
});

describe("handleSaveTransactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth and does not write KV", async () => {
    withoutAuth();
    const list: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
    ];
    await handleSaveTransactions("2026-07", list);
    expect(saveTransactionsMock).not.toHaveBeenCalled();
  });

  it("delegates the whole list to kvAdapter's saveTransactions when authenticated", async () => {
    withAuth();
    const list: FinanceV2Transaction[] = [
      {
        id: "t1",
        type: "expense",
        amount: 400,
        date: "2026-07-02",
        month: "2026-07",
        bucket: "fixed",
        category: null,
      },
    ];
    await handleSaveTransactions("2026-07", list);
    expect(saveTransactionsMock).toHaveBeenCalledWith("2026-07", list);
  });
});

describe("handleAppendTransactionToMonth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth and does not write KV", async () => {
    withoutAuth();
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "income",
      amount: 1000,
      date: "2026-07-01",
      month: "2026-08",
    };

    await handleAppendTransactionToMonth(tx);

    expect(appendTransactionToMonthMock).not.toHaveBeenCalled();
  });

  it("does nothing and does not write KV when tx.month is malformed", async () => {
    withAuth();
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "income",
      amount: 1000,
      date: "2026-07-01",
      month: "2026-13",
    };

    await handleAppendTransactionToMonth(tx);

    expect(appendTransactionToMonthMock).not.toHaveBeenCalled();
  });

  it("derives the target month from tx.month and appends when authenticated and valid", async () => {
    withAuth();
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "savings",
      amount: 300,
      date: "2026-07-31",
      month: "2026-08",
    };

    await handleAppendTransactionToMonth(tx);

    expect(appendTransactionToMonthMock).toHaveBeenCalledWith("2026-08", tx);
  });
});

describe("handleLoadTransactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns [] without auth and does not call loadTransactions", async () => {
    withoutAuth();

    const result = await handleLoadTransactions("2026-07");

    expect(result).toEqual([]);
    expect(loadTransactionsMock).not.toHaveBeenCalled();
  });

  it("returns [] for a malformed month even when authenticated", async () => {
    withAuth();

    const result = await handleLoadTransactions("2026-13");

    expect(result).toEqual([]);
    expect(loadTransactionsMock).not.toHaveBeenCalled();
  });

  it("delegates to loadTransactions(month) and returns its result when authenticated and month is well-formed", async () => {
    withAuth();
    const list: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
    ];
    loadTransactionsMock.mockResolvedValue(list);

    const result = await handleLoadTransactions("2026-07");

    expect(loadTransactionsMock).toHaveBeenCalledWith("2026-07");
    expect(result).toBe(list);
  });
});

const envelopeConfig: EnvelopeConfig = {
  name: "Servicios",
  boundCategoryId: "cuentas",
  openingBalance: 30_000,
  openingMonth: "2026-10",
};

describe("handleSaveEnvelopeConfig", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing without auth and does not write KV", async () => {
    withoutAuth();
    await handleSaveEnvelopeConfig(envelopeConfig);
    expect(saveEnvelopeConfigMock).not.toHaveBeenCalled();
  });

  it("delegates to kvAdapter when authenticated and the config is valid", async () => {
    withAuth();
    await handleSaveEnvelopeConfig(envelopeConfig);
    expect(saveEnvelopeConfigMock).toHaveBeenCalledWith(envelopeConfig);
  });

  it("accepts a zero or negative opening balance (a negative balance is a warning, never blocked)", async () => {
    withAuth();
    await handleSaveEnvelopeConfig({ ...envelopeConfig, openingBalance: -5000 });
    await handleSaveEnvelopeConfig({ ...envelopeConfig, openingBalance: 0 });
    expect(saveEnvelopeConfigMock).toHaveBeenCalledTimes(2);
  });

  // Cast through `unknown`: a Server Action is POST-reachable, so its argument is
  // whatever the caller sent — the TypeScript signature is no guarantee.
  it.each([
    ["an empty name", { ...envelopeConfig, name: "" }],
    ["a blank name", { ...envelopeConfig, name: "   " }],
    ["a non-string name", { ...envelopeConfig, name: 42 }],
    ["an empty boundCategoryId", { ...envelopeConfig, boundCategoryId: "" }],
    ["a non-string boundCategoryId", { ...envelopeConfig, boundCategoryId: null }],
    ["a NaN openingBalance", { ...envelopeConfig, openingBalance: NaN }],
    ["an infinite openingBalance", { ...envelopeConfig, openingBalance: Infinity }],
    ["a numeric-string openingBalance", { ...envelopeConfig, openingBalance: "30000" }],
    ["a malformed openingMonth", { ...envelopeConfig, openingMonth: "2026-13" }],
    ["a missing openingMonth", { ...envelopeConfig, openingMonth: undefined }],
    ["a null config", null],
  ])("does nothing and does not write KV for %s", async (_label, config) => {
    withAuth();
    await handleSaveEnvelopeConfig(config as unknown as EnvelopeConfig);
    expect(saveEnvelopeConfigMock).not.toHaveBeenCalled();
  });
});

describe("handleLoadEnvelopeCarriedBalance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null without auth and reads nothing", async () => {
    withoutAuth();

    const result = await handleLoadEnvelopeCarriedBalance("2026-11");

    expect(result).toBeNull();
    expect(loadEnvelopeConfigMock).not.toHaveBeenCalled();
    expect(loadTransactionsForMonthsMock).not.toHaveBeenCalled();
  });

  it("returns null for a malformed month even when authenticated, and reads nothing", async () => {
    withAuth();

    const result = await handleLoadEnvelopeCarriedBalance("2026-13");

    expect(result).toBeNull();
    expect(loadEnvelopeConfigMock).not.toHaveBeenCalled();
    expect(loadTransactionsForMonthsMock).not.toHaveBeenCalled();
  });

  it("returns null when no envelope is configured", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue(null);

    const result = await handleLoadEnvelopeCarriedBalance("2026-11");

    expect(result).toBeNull();
    expect(loadTransactionsForMonthsMock).not.toHaveBeenCalled();
  });

  it("returns null for a month before the opening month, without reading transactions", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue(envelopeConfig);

    const result = await handleLoadEnvelopeCarriedBalance("2026-09");

    expect(result).toBeNull();
    expect(loadTransactionsForMonthsMock).not.toHaveBeenCalled();
  });

  it("returns the opening balance for the opening month itself, without reading transactions", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue(envelopeConfig);

    const result = await handleLoadEnvelopeCarriedBalance("2026-10");

    expect(result).toBe(30_000);
    expect(loadTransactionsForMonthsMock).not.toHaveBeenCalled();
  });

  // Spec: "Leftover carries into next month".
  it("carries the opening month's leftover into the next month", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue({ ...envelopeConfig, openingBalance: 0 });
    loadTransactionsForMonthsMock.mockResolvedValue([
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
        amount: 66_000,
        date: "2026-10-06",
        month: "2026-10",
        bucket: "fixed",
        category: { id: "agua", name: "Agua" },
        paidFrom: "envelope",
      },
    ] satisfies FinanceV2Transaction[]);

    const result = await handleLoadEnvelopeCarriedBalance("2026-11");

    expect(loadTransactionsForMonthsMock).toHaveBeenCalledWith(["2026-10"]);
    expect(result).toBe(7000);
  });

  it("reads every month from the opening month up to (excluding) the viewed one, across a year boundary, and ignores main-account activity", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue({ ...envelopeConfig, openingMonth: "2026-11" });
    loadTransactionsForMonthsMock.mockResolvedValue([
      { id: "t1", type: "transfer", amount: 100_000, date: "2026-11-01", month: "2026-11" },
      { id: "t2", type: "transfer", amount: 100_000, date: "2026-12-01", month: "2026-12" },
      {
        id: "t3",
        type: "expense",
        amount: 80_000,
        date: "2026-12-10",
        month: "2026-12",
        bucket: "fixed",
        category: { id: "luz", name: "Luz" },
        paidFrom: "envelope",
      },
      {
        id: "t4",
        type: "expense",
        amount: 999_000,
        date: "2026-12-11",
        month: "2026-12",
        bucket: "variable",
        category: null,
      },
      { id: "t5", type: "income", amount: 1_000_000, date: "2026-12-01", month: "2026-12" },
    ] satisfies FinanceV2Transaction[]);

    const result = await handleLoadEnvelopeCarriedBalance("2027-01");

    expect(loadTransactionsForMonthsMock).toHaveBeenCalledWith(["2026-11", "2026-12"]);
    expect(result).toBe(30_000 + 200_000 - 80_000);
  });
});

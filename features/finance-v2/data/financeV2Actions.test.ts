import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BudgetConfig, FinanceV2Transaction } from "@/features/finance-v2/domain";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const saveBudgetConfigMock = vi.hoisted(() => vi.fn());
const saveTransactionsMock = vi.hoisted(() => vi.fn());
const appendTransactionToMonthMock = vi.hoisted(() => vi.fn());
const loadTransactionsMock = vi.hoisted(() => vi.fn());

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
  };
});

import {
  handleSaveBudgetConfig,
  handleSaveTransactions,
  handleAppendTransactionToMonth,
  handleLoadTransactions,
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
      category: null,
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

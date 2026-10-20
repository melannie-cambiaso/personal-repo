import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  BudgetConfig,
  EnvelopeConfig,
  FinanceV2Transaction,
  SavingsFundConfig,
} from "@/features/finance-v2/domain";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const saveBudgetVersionMock = vi.hoisted(() => vi.fn());
const saveTransactionsMock = vi.hoisted(() => vi.fn());
const appendTransactionToMonthMock = vi.hoisted(() => vi.fn());
const loadTransactionsMock = vi.hoisted(() => vi.fn());
const saveEnvelopeConfigMock = vi.hoisted(() => vi.fn());
const loadEnvelopeConfigMock = vi.hoisted(() => vi.fn());
const saveSavingsFundConfigMock = vi.hoisted(() => vi.fn());
const loadSavingsFundConfigMock = vi.hoisted(() => vi.fn());
// Now mocked as a method on TransactionKvAdapter (the port adapter object), because
// envelopeCarriedBalance receives the repo by parameter and calls loadForMonths on it.
const loadForMonthsMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: () => ({ get: cookiesGetMock }),
}));
vi.mock("./kvAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kvAdapter")>();
  return {
    ...actual,
    saveBudgetVersion: saveBudgetVersionMock,
    saveTransactions: saveTransactionsMock,
    appendTransactionToMonth: appendTransactionToMonthMock,
    loadTransactions: loadTransactionsMock,
    saveEnvelopeConfig: saveEnvelopeConfigMock,
    loadEnvelopeConfig: loadEnvelopeConfigMock,
    saveSavingsFundConfig: saveSavingsFundConfigMock,
    loadSavingsFundConfig: loadSavingsFundConfigMock,
    TransactionKvAdapter: {
      ...actual.TransactionKvAdapter,
      loadForMonths: loadForMonthsMock,
    },
  };
});

import {
  handleSaveBudgetVersion,
  handleSaveTransactions,
  handleAppendTransactionToMonth,
  handleLoadTransactions,
  handleSaveEnvelopeConfig,
  handleLoadEnvelopeCarriedBalance,
  handleSaveSavingsFundConfig,
  handleLoadSavingsFundCarriedBalance,
} from "./financeV2Actions";
import { generateToken } from "@/shared/auth";

vi.stubEnv("WISHLIST_SECRET", "test-secret");

const withAuth = () => cookiesGetMock.mockReturnValue({ value: generateToken() });
const withForgedAuth = () => cookiesGetMock.mockReturnValue({ value: "forged" });
const withoutAuth = () => cookiesGetMock.mockReturnValue(undefined);

describe("handleSaveBudgetVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 15)); // current month: 2026-10
  });
  afterEach(() => vi.useRealTimers());

  it("does nothing for a closed (past) month: its budget history stays frozen", async () => {
    withAuth();
    await handleSaveBudgetVersion("2026-09", { categories: [] });
    expect(saveBudgetVersionMock).not.toHaveBeenCalled();
  });

  it("saves a future month", async () => {
    withAuth();
    const budget: BudgetConfig = { categories: [] };
    await handleSaveBudgetVersion("2026-11", budget);
    expect(saveBudgetVersionMock).toHaveBeenCalledWith("2026-11", budget);
  });

  it("does nothing with a forged auth cookie", async () => {
    withForgedAuth();
    await handleSaveBudgetVersion("2026-11", { categories: [] });
    expect(saveBudgetVersionMock).not.toHaveBeenCalled();
  });

  it("does nothing without auth and does not write KV", async () => {
    withoutAuth();
    const budget: BudgetConfig = { categories: [] };
    await handleSaveBudgetVersion("2026-10", budget);
    expect(saveBudgetVersionMock).not.toHaveBeenCalled();
  });

  it.each(["2026-13", "2026-1", "0000-00", "../x", ""])(
    "does nothing and does not write KV for the malformed month %j",
    async (month) => {
      withAuth();
      await handleSaveBudgetVersion(month, { categories: [] });
      expect(saveBudgetVersionMock).not.toHaveBeenCalled();
    }
  );

  it("delegates the month and config to kvAdapter when authenticated", async () => {
    withAuth();
    const budget: BudgetConfig = { categories: [] };
    await handleSaveBudgetVersion("2026-10", budget);
    expect(saveBudgetVersionMock).toHaveBeenCalledWith("2026-10", budget);
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
    expect(loadForMonthsMock).not.toHaveBeenCalled();
  });

  it("returns null for a malformed month even when authenticated, and reads nothing", async () => {
    withAuth();

    const result = await handleLoadEnvelopeCarriedBalance("2026-13");

    expect(result).toBeNull();
    expect(loadEnvelopeConfigMock).not.toHaveBeenCalled();
    expect(loadForMonthsMock).not.toHaveBeenCalled();
  });

  it("returns null when no envelope is configured", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue(null);

    const result = await handleLoadEnvelopeCarriedBalance("2026-11");

    expect(result).toBeNull();
    expect(loadForMonthsMock).not.toHaveBeenCalled();
  });

  it("returns null for a month before the opening month, without reading transactions", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue(envelopeConfig);

    const result = await handleLoadEnvelopeCarriedBalance("2026-09");

    expect(result).toBeNull();
    expect(loadForMonthsMock).not.toHaveBeenCalled();
  });

  it("returns the opening balance for the opening month itself, without reading transactions", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue(envelopeConfig);

    const result = await handleLoadEnvelopeCarriedBalance("2026-10");

    expect(result).toBe(30_000);
    expect(loadForMonthsMock).not.toHaveBeenCalled();
  });

  // Spec: "Leftover carries into next month".
  it("carries the opening month's leftover into the next month", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue({ ...envelopeConfig, openingBalance: 0 });
    loadForMonthsMock.mockResolvedValue([
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

    expect(loadForMonthsMock).toHaveBeenCalledWith(["2026-10"]);
    expect(result).toBe(7000);
  });

  // Spec: "Editing a past month updates the balance".
  it("reflects deleting a past month's bill in the next month's carried-in balance", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue({ ...envelopeConfig, openingBalance: 0 });
    const store: Record<string, FinanceV2Transaction[]> = {
      "2026-10": [
        { id: "t1", type: "transfer", amount: 116_000, date: "2026-10-01", month: "2026-10" },
        {
          id: "t2",
          type: "expense",
          amount: 109_000,
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
          bucket: "fixed",
          category: { id: "agua", name: "Agua" },
          paidFrom: "envelope",
        },
      ],
    };
    saveTransactionsMock.mockImplementation(async (month: string, list: FinanceV2Transaction[]) => {
      store[month] = list;
    });
    loadForMonthsMock.mockImplementation(async (months: string[]) =>
      months.flatMap((month) => store[month] ?? [])
    );

    const before = await handleLoadEnvelopeCarriedBalance("2026-11");
    await handleSaveTransactions(
      "2026-10",
      store["2026-10"].filter((tx) => tx.id !== "t3")
    );
    const after = await handleLoadEnvelopeCarriedBalance("2026-11");

    expect(before).toBe(-13_000);
    expect(after).toBe(7000);
  });

  it("reads every month from the opening month up to (excluding) the viewed one, across a year boundary, and ignores main-account activity", async () => {
    withAuth();
    loadEnvelopeConfigMock.mockResolvedValue({ ...envelopeConfig, openingMonth: "2026-11" });
    loadForMonthsMock.mockResolvedValue([
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

    expect(loadForMonthsMock).toHaveBeenCalledWith(["2026-11", "2026-12"]);
    expect(result).toBe(30_000 + 200_000 - 80_000);
  });
});

const fundConfig: SavingsFundConfig = {
  name: "Ahorros",
  openingBalance: 500_000,
  openingMonth: "2026-10",
};

describe("handleSaveSavingsFundConfig", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not save without a valid session", async () => {
    withoutAuth();
    await handleSaveSavingsFundConfig(fundConfig);
    expect(saveSavingsFundConfigMock).not.toHaveBeenCalled();
  });

  it("saves a valid config, including a zero or negative opening balance", async () => {
    withAuth();
    await handleSaveSavingsFundConfig(fundConfig);
    await handleSaveSavingsFundConfig({ ...fundConfig, openingBalance: 0 });
    expect(saveSavingsFundConfigMock).toHaveBeenCalledTimes(2);
    expect(saveSavingsFundConfigMock).toHaveBeenCalledWith(fundConfig);
  });

  it.each([
    ["a blank name", { ...fundConfig, name: "   " }],
    ["a non-string name", { ...fundConfig, name: 42 }],
    ["a NaN openingBalance", { ...fundConfig, openingBalance: NaN }],
    ["a numeric-string openingBalance", { ...fundConfig, openingBalance: "500000" }],
    ["a malformed openingMonth", { ...fundConfig, openingMonth: "2026-13" }],
    ["a missing openingMonth", { ...fundConfig, openingMonth: undefined }],
  ])("drops a config with %s", async (_label, config) => {
    withAuth();
    await handleSaveSavingsFundConfig(config as unknown as SavingsFundConfig);
    expect(saveSavingsFundConfigMock).not.toHaveBeenCalled();
  });
});

describe("handleLoadSavingsFundCarriedBalance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null without a valid session or for a malformed month", async () => {
    withoutAuth();
    expect(await handleLoadSavingsFundCarriedBalance("2026-11")).toBeNull();
    withAuth();
    expect(await handleLoadSavingsFundCarriedBalance("2026-13")).toBeNull();
    expect(loadSavingsFundConfigMock).not.toHaveBeenCalled();
  });

  it("returns null when no fund is configured or the month predates it", async () => {
    withAuth();
    loadSavingsFundConfigMock.mockResolvedValue(null);
    expect(await handleLoadSavingsFundCarriedBalance("2026-11")).toBeNull();
    loadSavingsFundConfigMock.mockResolvedValue(fundConfig);
    expect(await handleLoadSavingsFundCarriedBalance("2026-09")).toBeNull();
  });

  it("returns the opening balance for the opening month without reading transactions", async () => {
    withAuth();
    loadSavingsFundConfigMock.mockResolvedValue(fundConfig);
    expect(await handleLoadSavingsFundCarriedBalance("2026-10")).toBe(500_000);
    expect(loadForMonthsMock).not.toHaveBeenCalled();
  });

  it("adds deposits and subtracts withdrawals and fund-paid expenses of earlier months", async () => {
    withAuth();
    loadSavingsFundConfigMock.mockResolvedValue(fundConfig);
    loadForMonthsMock.mockResolvedValue([
      { id: "t1", type: "savings", amount: 100_000, date: "2026-10-01", month: "2026-10" },
      { id: "t2", type: "withdrawal", amount: 30_000, date: "2026-10-02", month: "2026-10" },
      {
        id: "t3",
        type: "expense",
        amount: 20_000,
        date: "2026-10-03",
        month: "2026-10",
        bucket: "variable",
        category: { id: "super", name: "Supermercado" },
        paidFrom: "savingsFund",
      },
      {
        id: "t4",
        type: "expense",
        amount: 9_999,
        date: "2026-10-04",
        month: "2026-10",
        bucket: "variable",
        category: null,
      },
    ] satisfies FinanceV2Transaction[]);

    const result = await handleLoadSavingsFundCarriedBalance("2026-11");

    expect(loadForMonthsMock).toHaveBeenCalledWith(["2026-10"]);
    expect(result).toBe(550_000);
  });
});

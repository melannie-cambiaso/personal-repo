import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));

vi.mock("@/shared/kv", () => ({ redis: redisMock }));

import {
  loadBudgetConfig,
  saveBudgetConfig,
  transactionsKey,
  loadTransactions,
  saveTransactions,
  appendTransactionToMonth,
} from "./kvAdapter";
import { DEFAULT_BUDGET_CONFIG } from "@/features/finance-v2/domain";
import type { BudgetConfig, FinanceV2Transaction } from "@/features/finance-v2/domain";

describe("loadBudgetConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns defaults when the key is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadBudgetConfig();
    expect(result).toEqual(DEFAULT_BUDGET_CONFIG);
  });

  it("returns the stored config when present", async () => {
    const stored: BudgetConfig = {
      categories: [
        { id: "c1", name: "Renta", bucket: "fixed", amount: 500_000, subcategories: [] },
      ],
    };
    redisMock.get.mockResolvedValue(stored);
    const result = await loadBudgetConfig();
    expect(result).toEqual(stored);
  });

  it("uses the flat global key finance-v2-budget-config", async () => {
    redisMock.get.mockResolvedValue(null);
    await loadBudgetConfig();
    expect(redisMock.get).toHaveBeenCalledWith("finance-v2-budget-config");
  });

  it("returns defaults when redis.get throws", async () => {
    redisMock.get.mockRejectedValue(new Error("connection lost"));
    const result = await loadBudgetConfig();
    expect(result).toEqual(DEFAULT_BUDGET_CONFIG);
  });
});

describe("saveBudgetConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the config under the flat global key", async () => {
    const config: BudgetConfig = { categories: [] };
    await saveBudgetConfig(config);
    expect(redisMock.set).toHaveBeenCalledWith("finance-v2-budget-config", config);
  });

  it("swallows redis errors on save", async () => {
    redisMock.set.mockRejectedValue(new Error("connection lost"));
    await expect(saveBudgetConfig({ categories: [] })).resolves.toBeUndefined();
  });
});

describe("transactionsKey", () => {
  it("builds the month-scoped key finance-v2-transactions:YYYY-MM", () => {
    expect(transactionsKey("2026-07")).toBe("finance-v2-transactions:2026-07");
  });
});

describe("loadTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when the month's key is missing (default-on-miss)", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadTransactions("2026-07");
    expect(result).toEqual([]);
  });

  it("returns the stored transactions for the given month", async () => {
    const stored: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
    ];
    redisMock.get.mockResolvedValue(stored);
    const result = await loadTransactions("2026-07");
    expect(result).toEqual(stored);
  });

  it("backfills a missing month with the key's month (legacy record)", async () => {
    const legacy = [{ id: "t1", type: "income", amount: 1000, date: "2026-06-15" }];
    redisMock.get.mockResolvedValue(legacy);
    const result = await loadTransactions("2026-06");
    expect(result).toEqual([{ id: "t1", type: "income", amount: 1000, date: "2026-06-15", month: "2026-06" }]);
  });

  it("preserves an already-present month instead of overwriting it with the key's month", async () => {
    const stored: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-08" },
    ];
    redisMock.get.mockResolvedValue(stored);
    const result = await loadTransactions("2026-07");
    expect(result).toEqual(stored);
  });

  it("is idempotent — backfilling an already-backfilled list does not change it", async () => {
    const stored: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-07-01", month: "2026-07" },
    ];
    redisMock.get.mockResolvedValue(stored);
    const first = await loadTransactions("2026-07");
    redisMock.get.mockResolvedValue(first);
    const second = await loadTransactions("2026-07");
    expect(second).toEqual(first);
  });

  it("uses the month-scoped key finance-v2-transactions:YYYY-MM", async () => {
    redisMock.get.mockResolvedValue(null);
    await loadTransactions("2026-07");
    expect(redisMock.get).toHaveBeenCalledWith("finance-v2-transactions:2026-07");
  });

  it("returns an empty array (default) when redis.get throws (throw-swallow)", async () => {
    redisMock.get.mockRejectedValue(new Error("connection lost"));
    const result = await loadTransactions("2026-07");
    expect(result).toEqual([]);
  });
});

describe("saveTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves transactions under the month-scoped key", async () => {
    const list: FinanceV2Transaction[] = [
      { id: "t1", type: "savings", amount: 200, date: "2026-07-25", month: "2026-07" },
    ];
    await saveTransactions("2026-07", list);
    expect(redisMock.set).toHaveBeenCalledWith("finance-v2-transactions:2026-07", list);
  });

  it("swallows redis errors on save (throw-swallow)", async () => {
    redisMock.set.mockRejectedValue(new Error("connection lost"));
    await expect(saveTransactions("2026-07", [])).resolves.toBeUndefined();
  });
});

describe("appendTransactionToMonth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends the transaction to the TARGET month's existing list and saves under the target key only", async () => {
    const existing: FinanceV2Transaction[] = [
      { id: "t1", type: "income", amount: 1000, date: "2026-08-01", month: "2026-08" },
    ];
    redisMock.get.mockResolvedValue(existing);
    const tx: FinanceV2Transaction = {
      id: "t2",
      type: "savings",
      amount: 300,
      date: "2026-07-31",
      month: "2026-08",
    };

    await appendTransactionToMonth("2026-08", tx);

    expect(redisMock.get).toHaveBeenCalledWith("finance-v2-transactions:2026-08");
    expect(redisMock.set).toHaveBeenCalledTimes(1);
    expect(redisMock.set).toHaveBeenCalledWith("finance-v2-transactions:2026-08", [...existing, tx]);
  });

  it("appends to an empty list when the target month has no stored transactions yet", async () => {
    redisMock.get.mockResolvedValue(null);
    const tx: FinanceV2Transaction = {
      id: "t1",
      type: "expense",
      amount: 100,
      date: "2026-09-01",
      month: "2026-09",
      bucket: "variable",
      category: null,
    };

    await appendTransactionToMonth("2026-09", tx);

    expect(redisMock.set).toHaveBeenCalledWith("finance-v2-transactions:2026-09", [tx]);
  });
});

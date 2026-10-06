import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), mget: vi.fn() }));

vi.mock("@/shared/kv", () => ({ redis: redisMock }));

import {
  loadBudgetVersions,
  saveBudgetVersion,
  transactionsKey,
  loadTransactions,
  saveTransactions,
  appendTransactionToMonth,
  loadEnvelopeConfig,
  saveEnvelopeConfig,
  loadTransactionsForMonths,
} from "./kvAdapter";
import { DEFAULT_BUDGET_CONFIG } from "@/features/finance-v2/domain";
import type {
  BudgetConfig,
  BudgetVersion,
  EnvelopeConfig,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";

const legacyConfig: BudgetConfig = {
  categories: [{ id: "c1", name: "Renta", bucket: "fixed", amount: 500_000, subcategories: [] }],
};

const storedVersions: BudgetVersion[] = [
  { effectiveFrom: "0000-00", config: legacyConfig, updatedAt: "2026-09-01T00:00:00.000Z" },
  { effectiveFrom: "2026-10", config: { categories: [] }, updatedAt: "2026-10-01T00:00:00.000Z" },
];

/** `redis.get` answering per key, so a test can stage the versions and legacy keys. */
const stageKeys = (store: Record<string, unknown>) =>
  redisMock.get.mockImplementation(async (key: string) => store[key] ?? null);

describe("loadBudgetVersions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the stored versions from the finance-v2-budget-versions key", async () => {
    stageKeys({ "finance-v2-budget-versions": storedVersions });
    const result = await loadBudgetVersions();
    expect(result).toEqual(storedVersions);
    expect(redisMock.get).toHaveBeenCalledWith("finance-v2-budget-versions");
  });

  it("seeds one 0000-00 version from the legacy config when the versions key is missing, without writing", async () => {
    stageKeys({ "finance-v2-budget-config": legacyConfig });
    const result = await loadBudgetVersions();
    expect(result).toEqual([
      { effectiveFrom: "0000-00", config: legacyConfig, updatedAt: expect.any(String) },
    ]);
    expect(redisMock.set).not.toHaveBeenCalled();
  });

  it("seeds from the default config when neither key exists", async () => {
    stageKeys({});
    const result = await loadBudgetVersions();
    expect(result).toEqual([
      { effectiveFrom: "0000-00", config: DEFAULT_BUDGET_CONFIG, updatedAt: expect.any(String) },
    ]);
  });

  it("returns [] (every month resolves to the default) when redis.get throws", async () => {
    redisMock.get.mockRejectedValue(new Error("connection lost"));
    const result = await loadBudgetVersions();
    expect(result).toEqual([]);
  });
});

describe("saveBudgetVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts the month's version and keeps every other version", async () => {
    stageKeys({ "finance-v2-budget-versions": storedVersions });
    const config: BudgetConfig = { categories: [] };

    await saveBudgetVersion("2026-11", config);

    expect(redisMock.set).toHaveBeenCalledOnce();
    const [key, saved] = redisMock.set.mock.calls[0] as [string, BudgetVersion[]];
    expect(key).toBe("finance-v2-budget-versions");
    expect(saved.map((v) => v.effectiveFrom)).toEqual(["0000-00", "2026-10", "2026-11"]);
    expect(saved[2].config).toBe(config);
  });

  it("persists the legacy seed alongside the first edited month", async () => {
    stageKeys({ "finance-v2-budget-config": legacyConfig });

    await saveBudgetVersion("2026-10", { categories: [] });

    const saved = redisMock.set.mock.calls[0][1] as BudgetVersion[];
    expect(saved.map((v) => v.effectiveFrom)).toEqual(["0000-00", "2026-10"]);
    expect(saved[0].config).toEqual(legacyConfig);
    expect(redisMock.set).not.toHaveBeenCalledWith("finance-v2-budget-config", expect.anything());
  });

  // A failed read must never be mistaken for "no versions": writing then would wipe them.
  it("writes nothing when the read fails", async () => {
    redisMock.get.mockRejectedValue(new Error("connection lost"));
    await expect(saveBudgetVersion("2026-10", { categories: [] })).resolves.toBeUndefined();
    expect(redisMock.set).not.toHaveBeenCalled();
  });

  it("swallows redis errors on save", async () => {
    stageKeys({ "finance-v2-budget-versions": storedVersions });
    redisMock.set.mockRejectedValue(new Error("connection lost"));
    await expect(saveBudgetVersion("2026-10", { categories: [] })).resolves.toBeUndefined();
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
    expect(result).toEqual([
      { id: "t1", type: "income", amount: 1000, date: "2026-06-15", month: "2026-06" },
    ]);
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
    expect(redisMock.set).toHaveBeenCalledWith("finance-v2-transactions:2026-08", [
      ...existing,
      tx,
    ]);
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

const envelopeConfig: EnvelopeConfig = {
  name: "Servicios",
  boundCategoryId: "cuentas",
  openingBalance: 30_000,
  openingMonth: "2026-10",
};

describe("loadEnvelopeConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the key is missing (the envelope is optional)", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadEnvelopeConfig();
    expect(result).toBeNull();
  });

  it("returns the stored config when present", async () => {
    redisMock.get.mockResolvedValue(envelopeConfig);
    const result = await loadEnvelopeConfig();
    expect(result).toEqual(envelopeConfig);
  });

  it("uses the flat global key finance-v2-envelope-config", async () => {
    redisMock.get.mockResolvedValue(null);
    await loadEnvelopeConfig();
    expect(redisMock.get).toHaveBeenCalledWith("finance-v2-envelope-config");
  });

  it("returns null when redis.get throws", async () => {
    redisMock.get.mockRejectedValue(new Error("connection lost"));
    const result = await loadEnvelopeConfig();
    expect(result).toBeNull();
  });
});

describe("saveEnvelopeConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the config under the flat global key", async () => {
    await saveEnvelopeConfig(envelopeConfig);
    expect(redisMock.set).toHaveBeenCalledWith("finance-v2-envelope-config", envelopeConfig);
  });

  it("swallows redis errors on save", async () => {
    redisMock.set.mockRejectedValue(new Error("connection lost"));
    await expect(saveEnvelopeConfig(envelopeConfig)).resolves.toBeUndefined();
  });
});

describe("loadTransactionsForMonths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns [] without calling redis when no months are requested", async () => {
    const result = await loadTransactionsForMonths([]);
    expect(result).toEqual([]);
    expect(redisMock.mget).not.toHaveBeenCalled();
  });

  it("reads every month's key in ONE mget and concatenates the lists in month order", async () => {
    const october: FinanceV2Transaction[] = [
      { id: "t1", type: "transfer", amount: 116_000, date: "2026-10-01", month: "2026-10" },
    ];
    const november: FinanceV2Transaction[] = [
      { id: "t2", type: "income", amount: 1000, date: "2026-11-01", month: "2026-11" },
    ];
    redisMock.mget.mockResolvedValue([october, november]);

    const result = await loadTransactionsForMonths(["2026-10", "2026-11"]);

    expect(redisMock.mget).toHaveBeenCalledOnce();
    expect(redisMock.mget).toHaveBeenCalledWith(
      "finance-v2-transactions:2026-10",
      "finance-v2-transactions:2026-11"
    );
    expect(result).toEqual([...october, ...november]);
  });

  it("treats a missing month key as an empty list", async () => {
    const november: FinanceV2Transaction[] = [
      { id: "t2", type: "income", amount: 1000, date: "2026-11-01", month: "2026-11" },
    ];
    redisMock.mget.mockResolvedValue([null, november]);

    const result = await loadTransactionsForMonths(["2026-10", "2026-11"]);

    expect(result).toEqual(november);
  });

  it("backfills a legacy record's month with the month of the key it was loaded from", async () => {
    const legacyOctober = [{ id: "t1", type: "income", amount: 1000, date: "2026-10-15" }];
    const legacyNovember = [{ id: "t2", type: "income", amount: 2000, date: "2026-11-15" }];
    const tagged = [
      { id: "t3", type: "income", amount: 3000, date: "2026-10-31", month: "2026-12" },
    ];
    redisMock.mget.mockResolvedValue([legacyOctober, legacyNovember, tagged]);

    const result = await loadTransactionsForMonths(["2026-10", "2026-11", "2026-12"]);

    expect(result.map((tx) => [tx.id, tx.month])).toEqual([
      ["t1", "2026-10"],
      ["t2", "2026-11"],
      ["t3", "2026-12"],
    ]);
  });

  it("returns [] when redis.mget throws", async () => {
    redisMock.mget.mockRejectedValue(new Error("connection lost"));
    const result = await loadTransactionsForMonths(["2026-10"]);
    expect(result).toEqual([]);
  });
});

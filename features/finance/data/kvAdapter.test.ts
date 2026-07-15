import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));

vi.mock("@/shared/kv", () => ({ redis: redisMock }));

import {
  loadTransactions,
  saveTransactions,
  loadClosedCategories,
  saveClosedCategories,
  loadBudgetUnitConfig,
  saveBudgetUnitConfig,
  loadExcludedCategories,
  saveExcludedCategories,
  loadCategoryNotes,
  saveCategoryNotes,
} from "./kvAdapter";
import type { FinanceTransaction, BudgetUnitConfig } from "@/features/finance/domain";

const tx = (overrides: Partial<FinanceTransaction> = {}): FinanceTransaction => ({
  id: "abc-1",
  category: "Comida",
  amount: 500,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("loadTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when the key is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadTransactions("2026-06");
    expect(result).toEqual([]);
  });

  it("returns stored transactions for the given month", async () => {
    const stored = [tx(), tx({ id: "abc-2", amount: 200 })];
    redisMock.get.mockResolvedValue(stored);
    const result = await loadTransactions("2026-06");
    expect(result).toEqual(stored);
  });

  it("uses the correct key format: finance-transactions:YYYY-MM", async () => {
    redisMock.get.mockResolvedValue([]);
    await loadTransactions("2026-07");
    expect(redisMock.get).toHaveBeenCalledWith("finance-transactions:2026-07");
  });
});

describe("saveTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves transactions under the correct key", async () => {
    const txs = [tx()];
    await saveTransactions("2026-06", txs);
    expect(redisMock.set).toHaveBeenCalledWith("finance-transactions:2026-06", txs);
  });

  it("uses the correct key format for a different month", async () => {
    await saveTransactions("2025-12", []);
    expect(redisMock.set).toHaveBeenCalledWith("finance-transactions:2025-12", []);
  });
});

describe("loadClosedCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when the key is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadClosedCategories("2026-06");
    expect(result).toEqual([]);
  });

  it("uses the correct key format: finance-closed-categories:YYYY-MM", async () => {
    redisMock.get.mockResolvedValue([]);
    await loadClosedCategories("2026-07");
    expect(redisMock.get).toHaveBeenCalledWith("finance-closed-categories:2026-07");
  });

  it("returns the stored array for the given month", async () => {
    redisMock.get.mockResolvedValue(["Alquiler", "Internet"]);
    const result = await loadClosedCategories("2026-06");
    expect(result).toEqual(["Alquiler", "Internet"]);
  });
});

describe("saveClosedCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves closed categories under the correct key", async () => {
    await saveClosedCategories("2026-06", ["Alquiler"]);
    expect(redisMock.set).toHaveBeenCalledWith("finance-closed-categories:2026-06", ["Alquiler"]);
  });
});

describe("loadBudgetUnitConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty object when the key is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadBudgetUnitConfig("2026-06");
    expect(result).toEqual({});
  });

  it("uses the correct key format: finance-budget-unit-config:YYYY-MM", async () => {
    redisMock.get.mockResolvedValue({});
    await loadBudgetUnitConfig("2026-07");
    expect(redisMock.get).toHaveBeenCalledWith("finance-budget-unit-config:2026-07");
  });

  it("returns the stored config for the given month", async () => {
    const stored: BudgetUnitConfig = { DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 } };
    redisMock.get.mockResolvedValue(stored);
    const result = await loadBudgetUnitConfig("2026-06");
    expect(result).toEqual(stored);
  });

  it("returns an empty object when redis.get throws", async () => {
    redisMock.get.mockRejectedValue(new Error("connection lost"));
    const result = await loadBudgetUnitConfig("2026-06");
    expect(result).toEqual({});
  });
});

describe("loadExcludedCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when the key is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadExcludedCategories("2026-06");
    expect(result).toEqual([]);
  });

  it("uses the correct key format: finance-excluded-categories:YYYY-MM", async () => {
    redisMock.get.mockResolvedValue([]);
    await loadExcludedCategories("2026-07");
    expect(redisMock.get).toHaveBeenCalledWith("finance-excluded-categories:2026-07");
  });

  it("returns the stored array for the given month", async () => {
    redisMock.get.mockResolvedValue(["Suscripciones"]);
    const result = await loadExcludedCategories("2026-06");
    expect(result).toEqual(["Suscripciones"]);
  });

  it("returns an empty array when redis.get throws", async () => {
    redisMock.get.mockRejectedValue(new Error("connection lost"));
    const result = await loadExcludedCategories("2026-06");
    expect(result).toEqual([]);
  });
});

describe("saveExcludedCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves excluded categories under the correct key", async () => {
    await saveExcludedCategories("2026-06", ["Suscripciones"]);
    expect(redisMock.set).toHaveBeenCalledWith("finance-excluded-categories:2026-06", [
      "Suscripciones",
    ]);
  });

  it("swallows redis errors on save", async () => {
    redisMock.set.mockRejectedValue(new Error("connection lost"));
    await expect(saveExcludedCategories("2026-06", ["Suscripciones"])).resolves.toBeUndefined();
  });
});

describe("loadCategoryNotes (global — not month-scoped)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty object when the key is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadCategoryNotes();
    expect(result).toEqual({});
  });

  it("uses the global key with no month suffix: finance-category-notes", async () => {
    redisMock.get.mockResolvedValue({});
    await loadCategoryNotes();
    expect(redisMock.get).toHaveBeenCalledWith("finance-category-notes");
  });

  it("returns the stored map", async () => {
    const stored = { Suscripciones: "Netflix + Spotify" };
    redisMock.get.mockResolvedValue(stored);
    const result = await loadCategoryNotes();
    expect(result).toEqual(stored);
  });

  it("returns an empty object when redis.get throws", async () => {
    redisMock.get.mockRejectedValue(new Error("connection lost"));
    const result = await loadCategoryNotes();
    expect(result).toEqual({});
  });
});

describe("saveCategoryNotes (global — not month-scoped)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves category notes under the global key with no month suffix", async () => {
    const notes = { Suscripciones: "Netflix + Spotify" };
    await saveCategoryNotes(notes);
    expect(redisMock.set).toHaveBeenCalledWith("finance-category-notes", notes);
  });

  it("swallows redis errors on save", async () => {
    redisMock.set.mockRejectedValue(new Error("connection lost"));
    await expect(saveCategoryNotes({ Suscripciones: "Netflix" })).resolves.toBeUndefined();
  });
});

describe("saveBudgetUnitConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the unit config under the correct key", async () => {
    const config: BudgetUnitConfig = { DBT: { unitAmount: 55000, quantity: 5, factor: 0.9 } };
    await saveBudgetUnitConfig("2026-06", config);
    expect(redisMock.set).toHaveBeenCalledWith("finance-budget-unit-config:2026-06", config);
  });

  it("uses the correct key format for a different month", async () => {
    await saveBudgetUnitConfig("2025-12", {});
    expect(redisMock.set).toHaveBeenCalledWith("finance-budget-unit-config:2025-12", {});
  });
});

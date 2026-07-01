import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));

vi.mock("@/shared/kv", () => ({ redis: redisMock }));

import { loadTransactions, saveTransactions, loadClosedCategories, saveClosedCategories } from "./kvAdapter";
import type { FinanceTransaction } from "@/features/finance/domain";

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

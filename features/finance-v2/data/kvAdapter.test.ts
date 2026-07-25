import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));

vi.mock("@/shared/kv", () => ({ redis: redisMock }));

import { loadDashboardConfig, saveDashboardConfig, loadBudgetConfig, saveBudgetConfig } from "./kvAdapter";
import { DEFAULT_FINANCE_V2_CONFIG, DEFAULT_BUDGET_CONFIG } from "@/features/finance-v2/domain";
import type { FinanceV2Config, BudgetConfig } from "@/features/finance-v2/domain";

describe("loadDashboardConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns defaults when the key is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadDashboardConfig();
    expect(result).toEqual(DEFAULT_FINANCE_V2_CONFIG);
  });

  it("returns the stored config when present", async () => {
    const stored: FinanceV2Config = {
      income: 1_000_000,
      fixedPct: 40,
      variablePct: 40,
      savingsPct: 20,
    };
    redisMock.get.mockResolvedValue(stored);
    const result = await loadDashboardConfig();
    expect(result).toEqual(stored);
  });

  it("uses the flat global key finance-v2-dashboard-config", async () => {
    redisMock.get.mockResolvedValue(null);
    await loadDashboardConfig();
    expect(redisMock.get).toHaveBeenCalledWith("finance-v2-dashboard-config");
  });

  it("returns defaults when redis.get throws", async () => {
    redisMock.get.mockRejectedValue(new Error("connection lost"));
    const result = await loadDashboardConfig();
    expect(result).toEqual(DEFAULT_FINANCE_V2_CONFIG);
  });
});

describe("saveDashboardConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the config under the flat global key", async () => {
    const config: FinanceV2Config = {
      income: 1_000_000,
      fixedPct: 50,
      variablePct: 30,
      savingsPct: 20,
    };
    await saveDashboardConfig(config);
    expect(redisMock.set).toHaveBeenCalledWith("finance-v2-dashboard-config", config);
  });

  it("swallows redis errors on save", async () => {
    redisMock.set.mockRejectedValue(new Error("connection lost"));
    await expect(
      saveDashboardConfig({ income: 0, fixedPct: 50, variablePct: 30, savingsPct: 20 })
    ).resolves.toBeUndefined();
  });
});

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

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SavingsEntry } from "@/features/savings/domain/SavingsEntry";
import type { SavingsPeriod } from "@/features/savings/domain/SavingsPeriod";

const loadEntriesMock = vi.hoisted(() => vi.fn());
const loadPeriodsMock = vi.hoisted(() => vi.fn());

vi.mock("./kvAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kvAdapter")>();
  return {
    ...actual,
    loadEntries: loadEntriesMock,
    loadPeriods: loadPeriodsMock,
  };
});

import { loadHomeSavingsSummary } from "./homeSavingsSummary";

const entry = (
  id: string,
  type: SavingsEntry["type"],
  amount: number,
  periodId?: string,
  toReplenish = false
): SavingsEntry => ({
  id,
  type,
  amount,
  date: "2026-10-01",
  toReplenish,
  createdAt: "2026-10-01T00:00:00.000Z",
  ...(periodId && { periodId }),
});

describe("loadHomeSavingsSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("summarizes only the active period, starting from its initial amount", async () => {
    const closed: SavingsPeriod = {
      id: "p1",
      startedAt: "2026-01-01T00:00:00.000Z",
      closedAt: "2026-06-01T00:00:00.000Z",
      initialAmount: 0,
    };
    const active: SavingsPeriod = {
      id: "p2",
      startedAt: "2026-06-01T00:00:00.000Z",
      initialAmount: 100_000,
    };
    loadPeriodsMock.mockResolvedValue([closed, active]);
    loadEntriesMock.mockResolvedValue([
      entry("old-deposit", "deposito", 999_000, "p1"),
      entry("old-expense", "gasto", 5_000, "p1", true),
      entry("deposit", "deposito", 50_000, "p2"),
      entry("expense", "gasto", 30_000, "p2", true),
      entry("settled", "gasto", 10_000, "p2"),
    ]);

    const result = await loadHomeSavingsSummary();

    expect(result).toEqual({ balance: 110_000, toReplenish: 30_000 });
  });

  it("falls back to the initial period for legacy entries when no period is stored", async () => {
    loadPeriodsMock.mockResolvedValue([]);
    loadEntriesMock.mockResolvedValue([
      entry("deposit", "deposito", 20_000),
      entry("expense", "gasto", 25_000, undefined, true),
    ]);

    const result = await loadHomeSavingsSummary();

    expect(result).toEqual({ balance: -5_000, toReplenish: 25_000 });
  });

  it("returns zeros when nothing is stored", async () => {
    loadPeriodsMock.mockResolvedValue([]);
    loadEntriesMock.mockResolvedValue([]);

    const result = await loadHomeSavingsSummary();

    expect(result).toEqual({ balance: 0, toReplenish: 0 });
  });
});

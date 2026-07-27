import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));

vi.mock("@/shared/kv", () => ({ redis: redisMock }));

import { saveEntries, loadPeriods, savePeriods } from "./kvAdapter";
import type { SavingsEntry } from "../domain/SavingsEntry";
import type { SavingsPeriod } from "../domain/SavingsPeriod";

const entry = (overrides: Partial<SavingsEntry> = {}): SavingsEntry => ({
  id: "1",
  type: "deposito",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("saveEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps goalId on deposito entries", async () => {
    const entries = [entry({ type: "deposito", goalId: "g1" })];
    await saveEntries(entries);
    const saved = redisMock.set.mock.calls[0][1] as SavingsEntry[];
    expect(saved[0].goalId).toBe("g1");
  });

  it("drops goalId on gasto entries even if present", async () => {
    const entries = [entry({ type: "gasto", goalId: "g1" })];
    await saveEntries(entries);
    const saved = redisMock.set.mock.calls[0][1] as SavingsEntry[];
    expect(saved[0].goalId).toBeUndefined();
  });

  it("still forces toReplenish false on deposito entries (existing sanitize, unchanged)", async () => {
    const entries = [entry({ type: "deposito", toReplenish: true })];
    await saveEntries(entries);
    const saved = redisMock.set.mock.calls[0][1] as SavingsEntry[];
    expect(saved[0].toReplenish).toBe(false);
  });

  it("preserves periodId through the sanitize map on both entry types (regression)", async () => {
    const entries = [
      entry({ id: "1", type: "deposito", periodId: "p1" }),
      entry({ id: "2", type: "gasto", periodId: "p2" }),
    ];
    await saveEntries(entries);
    const saved = redisMock.set.mock.calls[0][1] as SavingsEntry[];
    expect(saved[0].periodId).toBe("p1");
    expect(saved[1].periodId).toBe("p2");
  });
});

const period = (overrides: Partial<SavingsPeriod> = {}): SavingsPeriod => ({
  id: "p1",
  startedAt: "2026-01-01T00:00:00Z",
  initialAmount: 1000,
  ...overrides,
});

describe("loadPeriods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the stored periods array", async () => {
    const stored = [period()];
    redisMock.get.mockResolvedValueOnce(stored);
    const result = await loadPeriods();
    expect(result).toEqual(stored);
  });

  it("returns an empty array when nothing is stored", async () => {
    redisMock.get.mockResolvedValueOnce(null);
    const result = await loadPeriods();
    expect(result).toEqual([]);
  });
});

describe("savePeriods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merge-guard: preserves stored id/startedAt/initialAmount for an existing period id, ignoring client tampering", async () => {
    const stored = [period({ id: "p1", startedAt: "2026-01-01T00:00:00Z", initialAmount: 1000 })];
    redisMock.get.mockResolvedValueOnce(stored);

    const tampered = [
      period({
        id: "p1",
        startedAt: "2099-01-01T00:00:00Z",
        initialAmount: 999999,
        closedAt: "2026-02-01T00:00:00Z",
      }),
    ];
    await savePeriods(tampered);

    const saved = redisMock.set.mock.calls[0][1] as SavingsPeriod[];
    expect(saved[0].startedAt).toBe("2026-01-01T00:00:00Z");
    expect(saved[0].initialAmount).toBe(1000);
    expect(saved[0].closedAt).toBe("2026-02-01T00:00:00Z");
  });

  it("lets a genuinely new period id pass through unguarded", async () => {
    redisMock.get.mockResolvedValueOnce([]);
    const fresh = [period({ id: "p2", startedAt: "2026-03-01T00:00:00Z", initialAmount: 500 })];
    await savePeriods(fresh);
    const saved = redisMock.set.mock.calls[0][1] as SavingsPeriod[];
    expect(saved[0]).toEqual(fresh[0]);
  });
});

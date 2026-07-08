import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));

vi.mock("@/shared/kv", () => ({ redis: redisMock }));

import { saveEntries } from "./kvAdapter";
import type { SavingsEntry } from "../domain/SavingsEntry";

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
});

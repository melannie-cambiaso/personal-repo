import { describe, it, expect } from "vitest";
import {
  INITIAL_PERIOD_ID,
  resolveActivePeriod,
  resolveEntryPeriodId,
  selectPeriodEntries,
} from "./SavingsPeriod";
import type { SavingsPeriod } from "./SavingsPeriod";
import type { SavingsEntry } from "./SavingsEntry";

const entry = (overrides: Partial<SavingsEntry>): SavingsEntry => ({
  id: "1",
  type: "deposito",
  amount: 100,
  date: "2026-06-01",
  toReplenish: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

const period = (overrides: Partial<SavingsPeriod>): SavingsPeriod => ({
  id: "p1",
  startedAt: "2026-01-01T00:00:00Z",
  initialAmount: 0,
  ...overrides,
});

describe("resolveActivePeriod", () => {
  it("synthesizes a bootstrap active period when no periods exist", () => {
    const active = resolveActivePeriod([]);

    expect(active.id).toBe(INITIAL_PERIOD_ID);
    expect(active.closedAt).toBeUndefined();
    expect(active.initialAmount).toBe(0);
  });

  it("returns the single period with no closedAt", () => {
    const closed = period({ id: "p1", closedAt: "2026-02-01T00:00:00Z" });
    const active = period({ id: "p2", startedAt: "2026-02-01T00:00:00Z", initialAmount: 500 });

    expect(resolveActivePeriod([closed, active])).toBe(active);
  });
});

describe("resolveEntryPeriodId", () => {
  it("returns the entry's periodId when set", () => {
    expect(resolveEntryPeriodId(entry({ periodId: "p1" }))).toBe("p1");
  });

  it("falls back to INITIAL_PERIOD_ID when the entry has no periodId", () => {
    expect(resolveEntryPeriodId(entry({}))).toBe(INITIAL_PERIOD_ID);
  });
});

describe("selectPeriodEntries", () => {
  it("filters entries resolving to the given periodId, including untagged legacy entries", () => {
    const entries = [
      entry({ id: "1", periodId: "p1" }),
      entry({ id: "2" }),
      entry({ id: "3", periodId: "p2" }),
    ];

    expect(selectPeriodEntries(entries, "p1").map((e) => e.id)).toEqual(["1"]);
    expect(selectPeriodEntries(entries, INITIAL_PERIOD_ID).map((e) => e.id)).toEqual(["2"]);
  });
});

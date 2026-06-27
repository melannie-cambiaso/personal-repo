import { describe, it, expect } from "vitest";
import { groupTransactionsByDay } from "./groupTransactionsByDay";
import type { FinanceTransaction } from "./FinanceTransaction";

const tx = (overrides: Partial<FinanceTransaction>): FinanceTransaction => ({
  id: "1",
  category: "Comida",
  amount: 100,
  createdAt: "2026-06-01T12:00:00.000Z",
  ...overrides,
});

// Helper: extract local date string the same way the implementation does
function localDateKey(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("groupTransactionsByDay", () => {
  it("returns [] for empty input", () => {
    expect(groupTransactionsByDay([])).toEqual([]);
  });

  it("returns one group for a single transaction", () => {
    const t = tx({ id: "1", createdAt: "2026-06-01T12:00:00.000Z" });
    const result = groupTransactionsByDay([t]);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(localDateKey("2026-06-01T12:00:00.000Z"));
    expect(result[0].transactions).toEqual([t]);
  });

  it("groups two transactions on the same local day into one group, sorted createdAt descending", () => {
    const older = tx({ id: "1", createdAt: "2026-06-01T08:00:00.000Z" });
    const newer = tx({ id: "2", createdAt: "2026-06-01T15:00:00.000Z" });
    const result = groupTransactionsByDay([older, newer]);
    expect(result).toHaveLength(1);
    expect(result[0].transactions[0]).toBe(newer);
    expect(result[0].transactions[1]).toBe(older);
  });

  it("creates separate groups for transactions on different days, sorted date descending", () => {
    const t1 = tx({ id: "1", createdAt: "2026-06-01T12:00:00.000Z" });
    const t2 = tx({ id: "2", createdAt: "2026-06-03T12:00:00.000Z" });
    const t3 = tx({ id: "3", createdAt: "2026-06-02T12:00:00.000Z" });
    const result = groupTransactionsByDay([t1, t2, t3]);
    expect(result).toHaveLength(3);
    // Most recent day first
    expect(result[0].date).toBe(localDateKey("2026-06-03T12:00:00.000Z"));
    expect(result[1].date).toBe(localDateKey("2026-06-02T12:00:00.000Z"));
    expect(result[2].date).toBe(localDateKey("2026-06-01T12:00:00.000Z"));
  });

  it("TIMEZONE EDGE (REQ-007): buckets by local date, not UTC date", () => {
    // 2026-06-27T02:30:00.000Z is UTC June 27, but in ART (UTC-3) it is June 26 at 23:30.
    // The function must bucket by LOCAL date. We assert against the runtime's own local
    // extraction so this test is timezone-agnostic and self-consistent — it never
    // hard-codes a date string.
    const createdAt = "2026-06-27T02:30:00.000Z";
    const expectedDate = localDateKey(createdAt);
    // Also demonstrate that naive UTC slice gives a DIFFERENT result when offset is negative
    const naiveUtcDate = createdAt.slice(0, 10); // "2026-06-27" in UTC

    const t = tx({ id: "1", createdAt });
    const result = groupTransactionsByDay([t]);
    expect(result).toHaveLength(1);
    // Must match LOCAL extraction
    expect(result[0].date).toBe(expectedDate);
    // In a UTC-negative timezone, the local date is EARLIER than the UTC date,
    // so they differ. We document the invariant: if this environment has a negative
    // UTC offset, the naive UTC slice would put the tx in the wrong bucket.
    if (new Date().getTimezoneOffset() > 0) {
      // offset > 0 means we are behind UTC (e.g. ART = UTC-3 → offset = 180)
      expect(result[0].date).not.toBe(naiveUtcDate);
    }
    // Regardless of timezone, the function must produce the same date as
    // the local extraction helper — this is the hard invariant.
    expect(result[0].date).toBe(expectedDate);
  });

  it("stable order for transactions with identical createdAt", () => {
    const same = "2026-06-01T12:00:00.000Z";
    const t1 = tx({ id: "1", createdAt: same });
    const t2 = tx({ id: "2", createdAt: same });
    const result1 = groupTransactionsByDay([t1, t2]);
    const result2 = groupTransactionsByDay([t1, t2]);
    expect(result1[0].transactions.map((t) => t.id)).toEqual(
      result2[0].transactions.map((t) => t.id),
    );
  });
});

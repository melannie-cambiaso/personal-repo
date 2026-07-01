import { describe, it, expect } from "vitest";
import { computeSuggestedIncome } from "./computeSuggestedIncome";
import type { SavingsEntry } from "./SavingsEntry";

const NOW = new Date(2026, 5, 28); // June 28, 2026

function entry(type: "deposito" | "gasto", date: string, amount: number): SavingsEntry {
  return { id: date + type, type, amount, date, toReplenish: false, createdAt: date };
}

// Qualifying window: March, April, May 2026 (last 3 complete months before June)
// Excluded: June 2026 (current), February 2026 (4 months ago)

describe("computeSuggestedIncome", () => {
  it("returns 0 for empty entries", () => {
    expect(computeSuggestedIncome([], NOW)).toBe(0);
  });

  it("returns 0 when no deposito entries exist in the last 3 months", () => {
    const entries: SavingsEntry[] = [
      entry("gasto", "2026-05-10", 500),
      entry("gasto", "2026-04-05", 300),
    ];
    expect(computeSuggestedIncome(entries, NOW)).toBe(0);
  });

  it("returns Math.round(sum / 3) for deposito entries across last 3 months", () => {
    const entries: SavingsEntry[] = [
      entry("deposito", "2026-03-15", 1000), // March — 3 months ago
      entry("deposito", "2026-04-20", 1200), // April — 2 months ago
      entry("deposito", "2026-05-01", 800), // May   — 1 month ago
    ];
    // sum = 3000, 3000 / 3 = 1000
    expect(computeSuggestedIncome(entries, NOW)).toBe(1000);
  });

  it("excludes entries from the current in-progress month", () => {
    const entries: SavingsEntry[] = [
      entry("deposito", "2026-06-15", 9000), // June — current month, must be excluded
    ];
    expect(computeSuggestedIncome(entries, NOW)).toBe(0);
  });

  it("excludes entries older than 3 complete months ago", () => {
    const entries: SavingsEntry[] = [
      entry("deposito", "2026-02-10", 6000), // Feb — 4 months ago, too old
      entry("deposito", "2026-03-15", 1000), // March — still qualifies
      entry("deposito", "2026-04-20", 1200), // April — still qualifies
      entry("deposito", "2026-05-01", 800), // May   — still qualifies
    ];
    // Feb is ignored; sum = 3000, 3000 / 3 = 1000
    expect(computeSuggestedIncome(entries, NOW)).toBe(1000);
  });
});

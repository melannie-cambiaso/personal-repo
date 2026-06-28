import { describe, it, expect } from "vitest";
import { totalCostByZone, pendingCountByZone, itemsPlannedForMonth, itemsUnassigned } from "./derivedValues";
import type { ImprovementItem } from "./ImprovementItem";

const item = (overrides: Partial<ImprovementItem>): ImprovementItem => ({
  id: "1",
  zoneId: "z1",
  title: "Test",
  type: "Otro",
  estimatedCost: null,
  done: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("totalCostByZone", () => {
  it("returns empty map for empty input", () => {
    expect(totalCostByZone([])).toEqual(new Map());
  });

  it("sums costs per zone", () => {
    const items = [
      item({ zoneId: "z1", estimatedCost: 5000 }),
      item({ zoneId: "z1", estimatedCost: 3000 }),
      item({ zoneId: "z2", estimatedCost: 1000 }),
    ];
    const result = totalCostByZone(items);
    expect(result.get("z1")).toBe(8000);
    expect(result.get("z2")).toBe(1000);
  });

  it("treats null estimatedCost as 0", () => {
    const items = [
      item({ zoneId: "z1", estimatedCost: null }),
      item({ zoneId: "z1", estimatedCost: 2000 }),
    ];
    expect(totalCostByZone(items).get("z1")).toBe(2000);
  });

  it("excludes done items from total", () => {
    const items = [
      item({ zoneId: "z1", estimatedCost: 500, done: true }),
      item({ zoneId: "z1", estimatedCost: 500, done: false }),
    ];
    expect(totalCostByZone(items).get("z1")).toBe(500);
  });

  it("multiplies estimatedCost by quantity", () => {
    const items = [item({ zoneId: "z1", estimatedCost: 50000, quantity: 2 })];
    expect(totalCostByZone(items).get("z1")).toBe(100000);
  });

  it("defaults quantity to 1 when undefined", () => {
    const items = [item({ zoneId: "z1", estimatedCost: 30000 })];
    expect(totalCostByZone(items).get("z1")).toBe(30000);
  });
});

describe("itemsPlannedForMonth", () => {
  it("returns empty array for empty input", () => {
    expect(itemsPlannedForMonth([], "2026-06")).toEqual([]);
  });

  it("returns only non-done items matching the month", () => {
    const items = [
      item({ plannedMonth: "2026-06", done: false }),
      item({ plannedMonth: "2026-06", done: true }),
      item({ plannedMonth: "2026-07", done: false }),
    ];
    const result = itemsPlannedForMonth(items, "2026-06");
    expect(result).toHaveLength(1);
    expect(result[0].plannedMonth).toBe("2026-06");
    expect(result[0].done).toBe(false);
  });

  it("excludes done items even if plannedMonth matches", () => {
    const items = [item({ plannedMonth: "2026-06", done: true })];
    expect(itemsPlannedForMonth(items, "2026-06")).toHaveLength(0);
  });
});

describe("itemsUnassigned", () => {
  it("returns empty array for empty input", () => {
    expect(itemsUnassigned([])).toEqual([]);
  });

  it("returns non-done items without plannedMonth", () => {
    const items = [
      item({ plannedMonth: undefined, done: false }),
      item({ plannedMonth: "2026-06", done: false }),
      item({ plannedMonth: undefined, done: true }),
    ];
    const result = itemsUnassigned(items);
    expect(result).toHaveLength(1);
    expect(result[0].plannedMonth).toBeUndefined();
    expect(result[0].done).toBe(false);
  });

  it("excludes done items regardless of plannedMonth", () => {
    const items = [item({ done: true }), item({ plannedMonth: "2026-06", done: true })];
    expect(itemsUnassigned(items)).toHaveLength(0);
  });
});

describe("pendingCountByZone", () => {
  it("returns empty map for empty input", () => {
    expect(pendingCountByZone([])).toEqual(new Map());
  });

  it("counts only done=false items", () => {
    const items = [
      item({ zoneId: "z1", done: false }),
      item({ zoneId: "z1", done: true }),
      item({ zoneId: "z2", done: false }),
    ];
    const result = pendingCountByZone(items);
    expect(result.get("z1")).toBe(1);
    expect(result.get("z2")).toBe(1);
  });

  it("returns no entry for zone with all done", () => {
    const items = [item({ zoneId: "z1", done: true })];
    expect(pendingCountByZone(items).get("z1")).toBeUndefined();
  });
});

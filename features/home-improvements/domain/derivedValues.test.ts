import { describe, it, expect } from "vitest";
import { totalCostByZone, pendingCountByZone } from "./derivedValues";
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

  it("includes done items in total", () => {
    const items = [
      item({ zoneId: "z1", estimatedCost: 500, done: true }),
      item({ zoneId: "z1", estimatedCost: 500, done: false }),
    ];
    expect(totalCostByZone(items).get("z1")).toBe(1000);
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

import { describe, it, expect } from "vitest";
import { getWeeksInMonth, monthWindow } from "./monthUtils";

describe("monthWindow", () => {
  it("returns 7 months, ascending, centered on `center` at index `radius`", () => {
    const result = monthWindow("2026-07", 3);

    expect(result).toHaveLength(7);
    expect(result).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(result[3]).toBe("2026-07");
  });

  it("walks backward across a year boundary (into the previous December)", () => {
    const result = monthWindow("2026-02", 3);

    expect(result).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
    ]);
  });

  it("walks forward across a year boundary (into the next January)", () => {
    const result = monthWindow("2026-11", 3);

    expect(result).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
  });
});

describe("getWeeksInMonth", () => {
  it("counts 5 Mondays in a 5-Monday month (2026-08)", () => {
    expect(getWeeksInMonth("2026-08")).toBe(5);
  });

  it("counts 4 Mondays in a 4-Monday month (2026-09)", () => {
    expect(getWeeksInMonth("2026-09")).toBe(4);
  });

  it("falls back to 4 for an invalid month string", () => {
    expect(getWeeksInMonth("not-a-month")).toBe(4);
  });
});

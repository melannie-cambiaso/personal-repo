import { describe, it, expect } from "vitest";
import { monthWindow } from "./monthUtils";

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

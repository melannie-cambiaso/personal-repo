import { describe, it, expect } from "vitest";
import { toLocalISODate } from "./transactionDate";

describe("toLocalISODate", () => {
  it("formats a Date using LOCAL time components, not UTC", () => {
    // 2026-01-15 23:30 local time — using UTC methods here would risk drifting
    // into 2026-01-16 depending on the runner's timezone offset direction.
    const d = new Date(2026, 0, 15, 23, 30);
    expect(toLocalISODate(d)).toBe("2026-01-15");
  });

  it("pads single-digit month and day with a leading zero", () => {
    const d = new Date(2026, 2, 5);
    expect(toLocalISODate(d)).toBe("2026-03-05");
  });
});

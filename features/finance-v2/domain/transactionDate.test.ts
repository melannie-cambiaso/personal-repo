import { describe, it, expect } from "vitest";
import { monthOf, toLocalISODate } from "./transactionDate";

describe("monthOf", () => {
  it("returns the YYYY-MM prefix of a YYYY-MM-DD date string", () => {
    expect(monthOf("2026-07-25")).toBe("2026-07");
  });

  it("handles a december date without rolling into the next year", () => {
    expect(monthOf("2025-12-31")).toBe("2025-12");
  });
});

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

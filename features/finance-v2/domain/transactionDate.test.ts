import { describe, it, expect } from "vitest";
import { isTransactionMonth, toLocalISODate } from "./transactionDate";

describe("isTransactionMonth", () => {
  it("accepts a well-formed YYYY-MM string", () => {
    expect(isTransactionMonth("2026-07")).toBe(true);
  });

  it("accepts the boundary months 01 and 12", () => {
    expect(isTransactionMonth("2026-01")).toBe(true);
    expect(isTransactionMonth("2026-12")).toBe(true);
  });

  it("rejects a month number above 12", () => {
    expect(isTransactionMonth("2026-13")).toBe(false);
  });

  it("rejects a single-digit month missing the leading zero", () => {
    expect(isTransactionMonth("2026-7")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isTransactionMonth("")).toBe(false);
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

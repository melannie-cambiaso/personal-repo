import { describe, it, expect } from "vitest";
import { deriveUnitTotal } from "./BudgetUnitConfig";

describe("deriveUnitTotal", () => {
  it("computes unitAmount × quantity × factor (spec's worked example)", () => {
    const result = deriveUnitTotal({ unitAmount: 55000, quantity: 5, factor: 0.9 });
    expect(result).toBe(247500);
  });

  it("defaults (quantity=1, factor=1) return the unit amount unchanged", () => {
    const result = deriveUnitTotal({ unitAmount: 120000, quantity: 1, factor: 1 });
    expect(result).toBe(120000);
  });

  it("rounds a fractional factor to an integer, avoiding float noise", () => {
    const result = deriveUnitTotal({ unitAmount: 100, quantity: 1, factor: 1 / 3 });
    expect(result).toBe(33);
    expect(Number.isInteger(result)).toBe(true);
  });
});

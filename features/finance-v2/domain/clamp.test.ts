import { describe, it, expect } from "vitest";
import { clampAmount } from "./clamp";

describe("clampAmount", () => {
  it("clamps a negative number to 0", () => {
    expect(clampAmount(-500)).toBe(0);
  });

  it("clamps NaN input to 0", () => {
    expect(clampAmount(NaN)).toBe(0);
  });

  it("clamps an empty string to 0", () => {
    expect(clampAmount("")).toBe(0);
  });

  it("rounds a decimal amount to the nearest integer (CLP has no cents)", () => {
    expect(clampAmount(1000.5)).toBe(1001);
  });

  it("keeps a valid positive integer unchanged", () => {
    expect(clampAmount(25000)).toBe(25000);
  });

  it("parses a valid numeric string", () => {
    expect(clampAmount("5000")).toBe(5000);
  });
});

import { describe, it, expect } from "vitest";
import { clampIncome, clampPercentage } from "./clamp";

describe("clampIncome", () => {
  it("clamps a negative number to 0", () => {
    expect(clampIncome(-500)).toBe(0);
  });

  it("clamps NaN input to 0", () => {
    expect(clampIncome(NaN)).toBe(0);
  });

  it("clamps an empty string to 0", () => {
    expect(clampIncome("")).toBe(0);
  });

  it("keeps a valid positive number unchanged", () => {
    expect(clampIncome(1000000)).toBe(1000000);
  });

  it("parses a valid numeric string", () => {
    expect(clampIncome("750000")).toBe(750000);
  });

  it("rounds a decimal income value to the nearest integer (CLP has no cents)", () => {
    expect(clampIncome(1000.5)).toBe(1001);
  });
});

describe("clampPercentage", () => {
  it("clamps a negative number to 0", () => {
    expect(clampPercentage(-10)).toBe(0);
  });

  it("clamps NaN input to 0", () => {
    expect(clampPercentage(NaN)).toBe(0);
  });

  it("clamps an empty string to 0", () => {
    expect(clampPercentage("")).toBe(0);
  });

  it("clamps a value above 100 down to 100", () => {
    expect(clampPercentage(150)).toBe(100);
  });

  it("rounds a decimal value to the nearest integer", () => {
    expect(clampPercentage(49.6)).toBe(50);
  });

  it("keeps a valid integer percentage unchanged", () => {
    expect(clampPercentage(30)).toBe(30);
  });

  it("parses a valid numeric string", () => {
    expect(clampPercentage("20")).toBe(20);
  });
});

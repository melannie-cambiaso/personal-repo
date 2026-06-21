import { describe, it, expect } from "vitest";
import { computeForecast } from "./computeForecast";

describe("computeForecast", () => {
  it("returns exactly months entries", () => {
    expect(computeForecast(1000, 500, 6)).toHaveLength(6);
  });

  it("projectedBalance[0] === currentBalance + monthlyNet", () => {
    const result = computeForecast(1000, 500, 3);
    expect(result[0].projectedBalance).toBe(1500);
  });

  it("projectedBalance[N-1] === currentBalance + monthlyNet * N", () => {
    const result = computeForecast(1000, 500, 3);
    expect(result[2].projectedBalance).toBe(2500);
  });

  it("does not clamp negative projectedBalance", () => {
    const result = computeForecast(500, -200, 4);
    expect(result[2].projectedBalance).toBe(-100);
    expect(result[3].projectedBalance).toBe(-300);
  });

  it("zero monthlyNet keeps balance flat", () => {
    const result = computeForecast(800, 0, 6);
    result.forEach((r) => expect(r.projectedBalance).toBe(800));
  });

  it("month label is a non-empty string", () => {
    const result = computeForecast(0, 0, 3);
    result.forEach((r) => expect(r.month).toBeTruthy());
  });
});

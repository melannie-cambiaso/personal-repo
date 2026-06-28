import { describe, it, expect } from "vitest";
import { computeForecast } from "./computeForecast";
import type { ForecastConfig } from "./ForecastConfig";

function mkMonthKey(i: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const flatConfig: ForecastConfig = {
  defaultIncome: 500,
  monthlyExpense: 0,
  annualRate: 0,
  incomeOverrides: {},
};

describe("computeForecast", () => {
  it("returns exactly months entries", () => {
    expect(computeForecast(1000, flatConfig, 6)).toHaveLength(6);
  });

  it("projectedBalance[0] equals currentBalance plus net", () => {
    const result = computeForecast(1000, flatConfig, 3);
    expect(result[0].projectedBalance).toBe(1500);
  });

  it("projectedBalance[N-1] equals currentBalance plus net times N", () => {
    const result = computeForecast(1000, flatConfig, 3);
    expect(result[2].projectedBalance).toBe(2500);
  });

  it("does not clamp negative projectedBalance", () => {
    const config: ForecastConfig = {
      defaultIncome: 0,
      monthlyExpense: 200,
      annualRate: 0,
      incomeOverrides: {},
    };
    const result = computeForecast(500, config, 4);
    expect(result[2].projectedBalance).toBe(-100);
    expect(result[3].projectedBalance).toBe(-300);
  });

  it("zero net keeps balance flat", () => {
    const config: ForecastConfig = {
      defaultIncome: 0,
      monthlyExpense: 0,
      annualRate: 0,
      incomeOverrides: {},
    };
    const result = computeForecast(800, config, 6);
    result.forEach((r) => expect(r.projectedBalance).toBe(800));
  });

  it("month label is a non-empty string", () => {
    const result = computeForecast(0, flatConfig, 3);
    result.forEach((r) => expect(r.month).toBeTruthy());
  });

  it("annualRate=0 applies no compounding interest", () => {
    const result = computeForecast(1000, flatConfig, 3);
    expect(result[0].projectedBalance).toBe(1500);
    expect(result[1].projectedBalance).toBe(2000);
    expect(result[2].projectedBalance).toBe(2500);
  });

  it("with annualRate, 12 months of zero net compounds balance by annual rate", () => {
    const config: ForecastConfig = {
      defaultIncome: 0,
      monthlyExpense: 0,
      annualRate: 4.6,
      incomeOverrides: {},
    };
    const result = computeForecast(1000, config, 12);
    expect(result[11].projectedBalance).toBeCloseTo(1046, 0);
  });

  it("with annualRate, balance grows faster than without", () => {
    const base: ForecastConfig = {
      defaultIncome: 100,
      monthlyExpense: 0,
      annualRate: 0,
      incomeOverrides: {},
    };
    const compounded: ForecastConfig = { ...base, annualRate: 4.6 };
    const linear = computeForecast(1000, base, 12);
    const withRate = computeForecast(1000, compounded, 12);
    expect(withRate[11].projectedBalance).toBeGreaterThan(linear[11].projectedBalance);
  });

  it("uses incomeOverride for a matching month", () => {
    const key = mkMonthKey(0);
    const config: ForecastConfig = {
      defaultIncome: 1000,
      monthlyExpense: 600,
      annualRate: 0,
      incomeOverrides: { [key]: 1500 },
    };
    const result = computeForecast(0, config, 1);
    expect(result[0].projectedBalance).toBe(900); // 0 + (1500 - 600)
  });

  it("falls back to defaultIncome when no override is present", () => {
    const config: ForecastConfig = {
      defaultIncome: 1000,
      monthlyExpense: 600,
      annualRate: 0,
      incomeOverrides: {},
    };
    const result = computeForecast(0, config, 3);
    expect(result[0].projectedBalance).toBe(400); // 0 + (1000 - 600)
    expect(result[1].projectedBalance).toBe(800);
    expect(result[2].projectedBalance).toBe(1200);
  });

  it("ignores overrides for months outside the projected window", () => {
    const config: ForecastConfig = {
      defaultIncome: 1000,
      monthlyExpense: 600,
      annualRate: 0,
      incomeOverrides: { "2020-01": 9999 },
    };
    const result = computeForecast(0, config, 3);
    expect(result[0].projectedBalance).toBe(400); // uses defaultIncome
    expect(result[2].projectedBalance).toBe(1200);
  });

  it("every entry has a monthKey in YYYY-MM format", () => {
    const result = computeForecast(0, flatConfig, 3);
    result.forEach((r) => {
      expect(r.monthKey).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  it("monthKey matches the expected calendar month for each entry", () => {
    const result = computeForecast(0, flatConfig, 3);
    result.forEach((r, i) => {
      expect(r.monthKey).toBe(mkMonthKey(i));
    });
  });
});

import { describe, it, expect } from "vitest";
import { computeMonthSummary } from "./computeMonthSummary";
import type { FinanceEntry } from "./FinanceEntry";

const make = (type: FinanceEntry["type"], group: string, amount: number): FinanceEntry => ({
  id: crypto.randomUUID(), type, group, category: "x",
  amount, date: "2026-06-01", createdAt: new Date().toISOString(),
});

describe("computeMonthSummary", () => {
  it("returns zeroes and empty map for empty input", () => {
    const r = computeMonthSummary([]);
    expect(r.totalIncome).toBe(0);
    expect(r.totalExpenses).toBe(0);
    expect(r.net).toBe(0);
    expect(r.byGroup.size).toBe(0);
  });

  it("splits income and expenses correctly", () => {
    const entries = [make("income", "Ingresos", 1000), make("expense", "Gastos fijos", 300)];
    const r = computeMonthSummary(entries);
    expect(r.totalIncome).toBe(1000);
    expect(r.totalExpenses).toBe(300);
    expect(r.net).toBe(700);
  });

  it("aggregates byGroup correctly", () => {
    const entries = [
      make("expense", "Suscripciones", 50),
      make("expense", "Suscripciones", 30),
      make("expense", "Gastos fijos", 200),
    ];
    const r = computeMonthSummary(entries);
    expect(r.byGroup.get("Suscripciones")).toBe(80);
    expect(r.byGroup.get("Gastos fijos")).toBe(200);
  });

  it("net can be negative", () => {
    const entries = [make("income", "Ingresos", 100), make("expense", "Gastos fijos", 500)];
    expect(computeMonthSummary(entries).net).toBe(-400);
  });
});

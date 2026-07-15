import { describe, it, expect } from "vitest";
import { buildBudgetExportRows } from "./buildBudgetExportRows";
import type { FinanceTransaction } from "./FinanceTransaction";

const tx = (category: string, amount: number): FinanceTransaction => ({
  id: crypto.randomUUID(),
  category,
  amount,
  createdAt: "2026-07-01T00:00:00.000Z",
});

describe("buildBudgetExportRows", () => {
  it("includes one row per category across all groups", () => {
    const groups = [
      { name: "Sueldo", type: "income" as const, categories: ["Peter"] },
      { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo"] },
      { name: "Devolución", type: "refund" as const, categories: ["Isapre"] },
    ];

    const rows = buildBudgetExportRows(groups, {}, [], []);

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.categoria).sort()).toEqual(["Arriendo", "Isapre", "Peter"].sort());
  });

  it("computes diferencia as presupuestado - real for expense categories", () => {
    const groups = [{ name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo"] }];
    const budget = { Arriendo: 500 };
    const transactions = [tx("Arriendo", 300)];

    const rows = buildBudgetExportRows(groups, budget, transactions, []);

    expect(rows[0]).toMatchObject({
      categoria: "Arriendo",
      presupuestado: 500,
      real: 300,
      diferencia: 200,
    });
  });

  it("computes diferencia as real - presupuestado for income categories", () => {
    const groups = [{ name: "Sueldo", type: "income" as const, categories: ["Peter"] }];
    const budget = { Peter: 1000 };
    const transactions = [tx("Peter", 1200)];

    const rows = buildBudgetExportRows(groups, budget, transactions, []);

    expect(rows[0]).toMatchObject({
      categoria: "Peter",
      presupuestado: 1000,
      real: 1200,
      diferencia: 200,
    });
  });

  it("marks a closed expense category as cerrada: true", () => {
    const groups = [{ name: "Gastos fijos", type: "expense" as const, categories: ["Alquiler"] }];

    const rows = buildBudgetExportRows(groups, {}, [], ["Alquiler"]);

    expect(rows[0].cerrada).toBe(true);
  });

  it("does not mark income/refund categories as cerrada even if listed in closedCategories", () => {
    const groups = [{ name: "Sueldo", type: "income" as const, categories: ["Sueldo"] }];

    const rows = buildBudgetExportRows(groups, {}, [], ["Sueldo"]);

    expect(rows[0].cerrada).toBe(false);
  });

  it("defaults presupuestado and real to 0 when category has no budget or transactions", () => {
    const groups = [{ name: "Gastos fijos", type: "expense" as const, categories: ["Comida"] }];

    const rows = buildBudgetExportRows(groups, {}, [], []);

    expect(rows[0]).toMatchObject({ presupuestado: 0, real: 0 });
  });

  it("returns an empty array when there are no groups", () => {
    expect(buildBudgetExportRows([], {}, [], [])).toEqual([]);
  });

  it("orders rows income -> expense -> refund, categories sorted with localeCompare('es')", () => {
    const groups = [
      { name: "Gastos fijos", type: "expense" as const, categories: ["Zapatos", "Arriendo"] },
      { name: "Sueldo", type: "income" as const, categories: ["Peter"] },
      { name: "Devolución", type: "refund" as const, categories: ["Isapre"] },
    ];

    const rows = buildBudgetExportRows(groups, {}, [], []);

    expect(rows.map((r) => r.categoria)).toEqual(["Peter", "Arriendo", "Zapatos", "Isapre"]);
  });

  it("omits an excluded category's row from the export", () => {
    const groups = [
      { name: "Gastos fijos", type: "expense" as const, categories: ["Arriendo", "Suscripciones"] },
    ];

    const rows = buildBudgetExportRows(groups, {}, [], [], ["Suscripciones"]);

    expect(rows.map((r) => r.categoria)).toEqual(["Arriendo"]);
  });

  it("includes a re-included (not-excluded) category with its persisted amounts", () => {
    const groups = [
      { name: "Gastos fijos", type: "expense" as const, categories: ["Suscripciones"] },
    ];
    const budget = { Suscripciones: 20000 };
    const transactions = [tx("Suscripciones", 15000)];

    const rows = buildBudgetExportRows(groups, budget, transactions, [], []);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      categoria: "Suscripciones",
      presupuestado: 20000,
      real: 15000,
    });
  });
});

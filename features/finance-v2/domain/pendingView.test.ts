import { describe, it, expect } from "vitest";
import { computePendingView } from "./pendingView";
import type { ExpenseCategoryOption } from "./expenseCategoryOptions";
import type { SpendRow } from "./spendRollup";
import type { PendingOverrides } from "./pendingOverrides";

describe("computePendingView", () => {
  it("defaults an unoverridden leaf's pendiente to max(0, budgeted - spent)", () => {
    const options: ExpenseCategoryOption[] = [{ id: "c1", name: "Arriendo", bucket: "fixed" }];
    const leaves: Record<string, SpendRow> = { c1: { budgeted: 50000, spent: 20000 } };

    const view = computePendingView(options, leaves, {});

    expect(view.rows).toEqual([
      { id: "c1", name: "Arriendo", bucket: "fixed", computed: 30000, amount: 30000, isOverridden: false },
    ]);
  });

  it("clamps an overrun leaf's default pendiente to 0, never negative", () => {
    const options: ExpenseCategoryOption[] = [{ id: "c1", name: "Arriendo", bucket: "fixed" }];
    const leaves: Record<string, SpendRow> = { c1: { budgeted: 10000, spent: 15000 } };

    const view = computePendingView(options, leaves, {});

    expect(view.rows[0].computed).toBe(0);
    expect(view.rows[0].amount).toBe(0);
  });

  it("an override replaces the computed default entirely (not a delta)", () => {
    const options: ExpenseCategoryOption[] = [{ id: "c1", name: "Arriendo", bucket: "fixed" }];
    const leaves: Record<string, SpendRow> = { c1: { budgeted: 50000, spent: 20000 } };
    const overrides: PendingOverrides = { c1: 12000 };

    const view = computePendingView(options, leaves, overrides);

    expect(view.rows[0]).toEqual({
      id: "c1",
      name: "Arriendo",
      bucket: "fixed",
      computed: 30000,
      amount: 12000,
      isOverridden: true,
    });
  });

  it("clamps a negative override to 0", () => {
    const options: ExpenseCategoryOption[] = [{ id: "c1", name: "Arriendo", bucket: "fixed" }];
    const leaves: Record<string, SpendRow> = { c1: { budgeted: 50000, spent: 20000 } };
    const overrides: PendingOverrides = { c1: -500 };

    const view = computePendingView(options, leaves, overrides);

    expect(view.rows[0].amount).toBe(0);
  });

  it("never renders a savings-bucket leaf, even if it appears in leaves/overrides", () => {
    const options: ExpenseCategoryOption[] = [{ id: "c1", name: "Arriendo", bucket: "fixed" }];
    const leaves: Record<string, SpendRow> = {
      c1: { budgeted: 50000, spent: 20000 },
      savingsLeaf: { budgeted: 10000, spent: 0 },
    };
    const overrides: PendingOverrides = { savingsLeaf: 9999 };

    const view = computePendingView(options, leaves, overrides);

    expect(view.rows.map((r) => r.id)).toEqual(["c1"]);
  });

  it("an orphaned override (leaf deleted from BudgetConfig) is never rendered nor summed", () => {
    const options: ExpenseCategoryOption[] = [{ id: "c1", name: "Arriendo", bucket: "fixed" }];
    const leaves: Record<string, SpendRow> = { c1: { budgeted: 50000, spent: 20000 } };
    const overrides: PendingOverrides = { c1: 12000, deletedLeaf: 99999 };

    const view = computePendingView(options, leaves, overrides);

    expect(view.rows.map((r) => r.id)).toEqual(["c1"]);
    expect(view.total).toBe(12000);
  });

  it("sums every row's displayed amount into total, including overrides", () => {
    const options: ExpenseCategoryOption[] = [
      { id: "c1", name: "Arriendo", bucket: "fixed" },
      { id: "c2", name: "Ocio", bucket: "variable" },
    ];
    const leaves: Record<string, SpendRow> = {
      c1: { budgeted: 50000, spent: 20000 },
      c2: { budgeted: 20000, spent: 8000 },
    };
    const overrides: PendingOverrides = { c2: 12000 };

    const view = computePendingView(options, leaves, overrides);

    expect(view.total).toBe(42000);
  });

  it("returns total 0 for an empty leaf set", () => {
    const view = computePendingView([], {}, {});

    expect(view).toEqual({ rows: [], total: 0 });
  });

  it("sorts rows by name (localeCompare)", () => {
    const options: ExpenseCategoryOption[] = [
      { id: "c2", name: "Servicios", bucket: "fixed" },
      { id: "c1", name: "Arriendo", bucket: "fixed" },
    ];
    const leaves: Record<string, SpendRow> = {
      c1: { budgeted: 100, spent: 0 },
      c2: { budgeted: 100, spent: 0 },
    };

    const view = computePendingView(options, leaves, {});

    expect(view.rows.map((r) => r.name)).toEqual(["Arriendo", "Servicios"]);
  });

  it("treats a leaf absent from `leaves` as budgeted 0 / spent 0", () => {
    const options: ExpenseCategoryOption[] = [{ id: "c1", name: "Nueva", bucket: "fixed" }];

    const view = computePendingView(options, {}, {});

    expect(view.rows[0]).toEqual({
      id: "c1",
      name: "Nueva",
      bucket: "fixed",
      computed: 0,
      amount: 0,
      isOverridden: false,
    });
  });
});

import { describe, it, expect } from "vitest";
import { groupTransactionsByCategory } from "./groupTransactionsByCategory";
import type { FinanceTransaction } from "./FinanceTransaction";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tx = (overrides: Partial<FinanceTransaction>): FinanceTransaction => ({
  id: "1",
  category: "Comida",
  amount: 100,
  createdAt: "2026-06-01T12:00:00.000Z",
  ...overrides,
});

type Group = { name: string; categories: string[] };

const groups: Group[] = [
  { name: "Alimentación", categories: ["Comida", "Mercado"] },
  { name: "Transporte", categories: ["Colectivo"] },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("groupTransactionsByCategory", () => {
  it("returns [] for empty input", () => {
    expect(groupTransactionsByCategory([], groups)).toEqual([]);
  });

  it("does not return a category that is in groups but has zero transactions", () => {
    // "Colectivo" is in groups but not in any transaction
    const result = groupTransactionsByCategory([tx({ id: "1", category: "Comida" })], groups);
    const categories = result.map((g) => g.category);
    expect(categories).not.toContain("Colectivo");
  });

  it("total equals the sum of amount for that category", () => {
    const result = groupTransactionsByCategory(
      [
        tx({ id: "1", category: "Comida", amount: 300 }),
        tx({ id: "2", category: "Comida", amount: 200 }),
      ],
      groups
    );
    const comida = result.find((g) => g.category === "Comida");
    expect(comida?.total).toBe(500);
  });

  it("sorts transactions within a category by createdAt descending", () => {
    const older = tx({ id: "1", category: "Comida", createdAt: "2026-06-01T08:00:00.000Z" });
    const newer = tx({ id: "2", category: "Comida", createdAt: "2026-06-01T15:00:00.000Z" });
    const result = groupTransactionsByCategory([older, newer], groups);
    const comida = result.find((g) => g.category === "Comida");
    expect(comida?.transactions[0]).toBe(newer);
    expect(comida?.transactions[1]).toBe(older);
  });

  it("CUSTOM-GROUP REGRESSION (REQ-008): resolves groupName from passed groups, not DEFAULT_GROUPS", () => {
    // "Comida" is in the passed groups under "Alimentación".
    // If the function fell back to DEFAULT_GROUPS it might resolve differently or to "Otro".
    // The only groups that matter are the ones passed as the second argument.
    const customGroups: Group[] = [{ name: "Mi Grupo Personalizado", categories: ["Comida"] }];
    const result = groupTransactionsByCategory([tx({ id: "1", category: "Comida" })], customGroups);
    expect(result[0].groupName).toBe("Mi Grupo Personalizado");
  });

  it("resolves groupName to Otro when category is absent from all groups", () => {
    const result = groupTransactionsByCategory(
      [tx({ id: "1", category: "CategoriaDesconocida" })],
      groups
    );
    expect(result[0].groupName).toBe("Otro");
  });

  it("sorts result alphabetically by category (es locale)", () => {
    const result = groupTransactionsByCategory(
      [
        tx({ id: "1", category: "Mercado", amount: 50 }),
        tx({ id: "2", category: "Comida", amount: 100 }),
        tx({ id: "3", category: "Colectivo", amount: 30 }),
      ],
      groups
    );
    const categoryNames = result.map((g) => g.category);
    const sorted = [...categoryNames].sort((a, b) => a.localeCompare(b, "es"));
    expect(categoryNames).toEqual(sorted);
  });
});

import { describe, it, expect } from "vitest";
import { groupItemsByCategory } from "./groupItemsByCategory";
import type { ShoppingCategory } from "./ShoppingCategory";
import type { ShoppingItem } from "./ShoppingItem";

const category = (overrides: Partial<ShoppingCategory>): ShoppingCategory => ({
  id: "cat-1",
  name: "Limpieza",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const item = (overrides: Partial<ShoppingItem>): ShoppingItem => ({
  id: "1",
  name: "Leche",
  categoryId: "cat-1",
  checked: false,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("groupItemsByCategory", () => {
  it("returns an empty array when there are no categories", () => {
    expect(groupItemsByCategory([], [])).toEqual([]);
  });

  it("includes a category with an empty items array when it has no items", () => {
    const categories = [category({ id: "cat-1" })];
    const result = groupItemsByCategory(categories, []);
    expect(result).toHaveLength(1);
    expect(result[0].category.id).toBe("cat-1");
    expect(result[0].items).toEqual([]);
  });

  it("groups items under their matching category", () => {
    const categories = [category({ id: "cat-1", name: "Limpieza" })];
    const items = [
      item({ id: "1", categoryId: "cat-1" }),
      item({ id: "2", categoryId: "cat-1" }),
    ];
    const result = groupItemsByCategory(categories, items);
    expect(result[0].items.map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("preserves category insertion order across multiple categories", () => {
    const categories = [
      category({ id: "cat-2", name: "Supermercado" }),
      category({ id: "cat-1", name: "Limpieza" }),
    ];
    const items = [item({ id: "1", categoryId: "cat-1" })];
    const result = groupItemsByCategory(categories, items);
    expect(result.map((g) => g.category.id)).toEqual(["cat-2", "cat-1"]);
    expect(result[0].items).toEqual([]);
    expect(result[1].items.map((i) => i.id)).toEqual(["1"]);
  });

  it("excludes items whose categoryId does not match any known category", () => {
    const categories = [category({ id: "cat-1" })];
    const items = [item({ id: "1", categoryId: "cat-1" }), item({ id: "2", categoryId: "cat-orphan" })];
    const result = groupItemsByCategory(categories, items);
    expect(result[0].items.map((i) => i.id)).toEqual(["1"]);
  });
});

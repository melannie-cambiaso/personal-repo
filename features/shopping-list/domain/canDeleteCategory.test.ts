import { describe, it, expect } from "vitest";
import { canDeleteCategory } from "./canDeleteCategory";
import type { ShoppingItem } from "./ShoppingItem";

const item = (overrides: Partial<ShoppingItem>): ShoppingItem => ({
  id: "1",
  name: "Leche",
  categoryId: "cat-1",
  checked: false,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("canDeleteCategory", () => {
  it("returns false when an item belongs to the category", () => {
    const items = [item({ id: "1", categoryId: "cat-1" })];
    expect(canDeleteCategory("cat-1", items)).toBe(false);
  });

  it("returns true when there are no items at all", () => {
    expect(canDeleteCategory("cat-1", [])).toBe(true);
  });

  it("returns true when items belong only to other categories", () => {
    const items = [
      item({ id: "1", categoryId: "cat-2" }),
      item({ id: "2", categoryId: "cat-3" }),
    ];
    expect(canDeleteCategory("cat-1", items)).toBe(true);
  });

  it("returns false when at least one of several items matches the category", () => {
    const items = [
      item({ id: "1", categoryId: "cat-2" }),
      item({ id: "2", categoryId: "cat-1" }),
    ];
    expect(canDeleteCategory("cat-1", items)).toBe(false);
  });
});

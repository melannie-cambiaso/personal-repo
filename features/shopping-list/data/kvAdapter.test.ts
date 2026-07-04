import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));

vi.mock("@/shared/kv", () => ({ redis: redisMock }));

import {
  loadCategories,
  saveCategories,
  loadItems,
  saveItems,
} from "./kvAdapter";
import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";

const category = (
  overrides: Partial<ShoppingCategory> = {}
): ShoppingCategory => ({
  id: "cat-1",
  name: "Limpieza",
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

const item = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: "item-1",
  name: "Detergente",
  categoryId: "cat-1",
  checked: false,
  createdAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

describe("loadCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when the key is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadCategories();
    expect(result).toEqual([]);
  });

  it("returns an empty array when redis throws", async () => {
    redisMock.get.mockRejectedValue(new Error("boom"));
    const result = await loadCategories();
    expect(result).toEqual([]);
  });

  it("returns the stored categories", async () => {
    const stored = [category(), category({ id: "cat-2", name: "Supermercado" })];
    redisMock.get.mockResolvedValue(stored);
    const result = await loadCategories();
    expect(result).toEqual(stored);
  });

  it("uses the key 'shopping-list-categories'", async () => {
    redisMock.get.mockResolvedValue([]);
    await loadCategories();
    expect(redisMock.get).toHaveBeenCalledWith("shopping-list-categories");
  });
});

describe("saveCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves categories under the key 'shopping-list-categories'", async () => {
    const categories = [category()];
    await saveCategories(categories);
    expect(redisMock.set).toHaveBeenCalledWith("shopping-list-categories", categories);
  });

  it("does not throw when redis fails", async () => {
    redisMock.set.mockRejectedValue(new Error("boom"));
    await expect(saveCategories([])).resolves.not.toThrow();
  });
});

describe("loadItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when the key is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    const result = await loadItems();
    expect(result).toEqual([]);
  });

  it("returns an empty array when redis throws", async () => {
    redisMock.get.mockRejectedValue(new Error("boom"));
    const result = await loadItems();
    expect(result).toEqual([]);
  });

  it("returns the stored items", async () => {
    const stored = [item(), item({ id: "item-2", name: "Jabón" })];
    redisMock.get.mockResolvedValue(stored);
    const result = await loadItems();
    expect(result).toEqual(stored);
  });

  it("uses the key 'shopping-list-items'", async () => {
    redisMock.get.mockResolvedValue([]);
    await loadItems();
    expect(redisMock.get).toHaveBeenCalledWith("shopping-list-items");
  });
});

describe("saveItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves items under the key 'shopping-list-items'", async () => {
    const items = [item()];
    await saveItems(items);
    expect(redisMock.set).toHaveBeenCalledWith("shopping-list-items", items);
  });

  it("does not throw when redis fails", async () => {
    redisMock.set.mockRejectedValue(new Error("boom"));
    await expect(saveItems([])).resolves.not.toThrow();
  });
});

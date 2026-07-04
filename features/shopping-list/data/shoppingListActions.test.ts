import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const saveCategoriesMock = vi.hoisted(() => vi.fn());
const saveItemsMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: () => ({ get: cookiesGetMock }),
}));
vi.mock("./kvAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kvAdapter")>();
  return {
    ...actual,
    saveCategories: saveCategoriesMock,
    saveItems: saveItemsMock,
  };
});

import { handleSaveCategories, handleSaveItems } from "./shoppingListActions";

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

const withAuth = () => cookiesGetMock.mockReturnValue({ value: "token" });
const withoutAuth = () => cookiesGetMock.mockReturnValue(undefined);

describe("handleSaveCategories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when not authenticated", async () => {
    withoutAuth();
    await handleSaveCategories([category()]);
    expect(saveCategoriesMock).not.toHaveBeenCalled();
  });

  it("saves categories via kvAdapter when authenticated", async () => {
    withAuth();
    const categories = [category()];
    await handleSaveCategories(categories);
    expect(saveCategoriesMock).toHaveBeenCalledWith(categories);
  });
});

describe("handleSaveItems", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when not authenticated", async () => {
    withoutAuth();
    await handleSaveItems([item()]);
    expect(saveItemsMock).not.toHaveBeenCalled();
  });

  it("saves items via kvAdapter when authenticated", async () => {
    withAuth();
    const items = [item()];
    await handleSaveItems(items);
    expect(saveItemsMock).toHaveBeenCalledWith(items);
  });
});

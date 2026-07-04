import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShoppingList } from "./useShoppingList";
import type { ShoppingCategory, ShoppingItem } from "@/features/shopping-list/domain";

const makeCategory = (overrides: Partial<ShoppingCategory> = {}): ShoppingCategory => ({
  id: crypto.randomUUID(),
  name: "Cleaning",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const makeItem = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: crypto.randomUUID(),
  name: "Detergent",
  categoryId: "cat-1",
  checked: false,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const onSaveCategories = vi.fn();
const onSaveItems = vi.fn();

describe("useShoppingList", () => {
  beforeEach(() => {
    onSaveCategories.mockReset();
    onSaveItems.mockReset();
  });

  it("initial state: grouped preserves category insertion order and assigns items", () => {
    const categories = [
      makeCategory({ id: "cat-1", name: "Cleaning" }),
      makeCategory({ id: "cat-2", name: "Supermarket" }),
    ];
    const items = [
      makeItem({ id: "item-1", categoryId: "cat-2", name: "Milk" }),
      makeItem({ id: "item-2", categoryId: "cat-1", name: "Detergent" }),
    ];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: items,
        onSaveCategories,
        onSaveItems,
      })
    );
    expect(result.current.grouped).toHaveLength(2);
    expect(result.current.grouped[0].category.id).toBe("cat-1");
    expect(result.current.grouped[0].items).toEqual([items[1]]);
    expect(result.current.grouped[1].category.id).toBe("cat-2");
    expect(result.current.grouped[1].items).toEqual([items[0]]);
  });

  it("handleAddCategory appends a new category and calls onSaveCategories", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Cleaning" })];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: [],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleAddCategory("Supermarket"));
    expect(result.current.grouped).toHaveLength(2);
    expect(result.current.grouped[1].category.name).toBe("Supermarket");
    expect(onSaveCategories).toHaveBeenCalledOnce();
    const saved = onSaveCategories.mock.calls[0][0] as ShoppingCategory[];
    expect(saved).toHaveLength(2);
    expect(saved[1].name).toBe("Supermarket");
  });

  it("handleAddCategory with blank name does nothing and does not call onSaveCategories", () => {
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: [],
        initialItems: [],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleAddCategory("   "));
    expect(result.current.grouped).toHaveLength(0);
    expect(onSaveCategories).not.toHaveBeenCalled();
  });

  it("handleRenameCategory updates the name and calls onSaveCategories", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Old Name" })];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: [],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleRenameCategory("cat-1", "New Name"));
    expect(result.current.grouped[0].category.name).toBe("New Name");
    expect(result.current.grouped[0].category.id).toBe("cat-1");
    expect(onSaveCategories).toHaveBeenCalledOnce();
  });

  it("handleRenameCategory with blank name does nothing and does not call onSaveCategories", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Old Name" })];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: [],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleRenameCategory("cat-1", ""));
    expect(result.current.grouped[0].category.name).toBe("Old Name");
    expect(onSaveCategories).not.toHaveBeenCalled();
  });

  it("handleDeleteCategory removes an empty category and calls onSaveCategories", () => {
    const categories = [
      makeCategory({ id: "cat-1", name: "Cleaning" }),
      makeCategory({ id: "cat-2", name: "Supermarket" }),
    ];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: [],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleDeleteCategory("cat-1"));
    expect(result.current.grouped).toHaveLength(1);
    expect(result.current.grouped[0].category.id).toBe("cat-2");
    expect(onSaveCategories).toHaveBeenCalledOnce();
  });

  it("handleDeleteCategory blocked by existing items does NOT mutate state and does NOT call onSaveCategories", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Cleaning" })];
    const items = [makeItem({ id: "item-1", categoryId: "cat-1" })];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: items,
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleDeleteCategory("cat-1"));
    expect(result.current.grouped).toHaveLength(1);
    expect(result.current.grouped[0].category.id).toBe("cat-1");
    expect(onSaveCategories).not.toHaveBeenCalled();
  });

  it("handleAddItem appends a new item under the given category and calls onSaveItems", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Cleaning" })];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: [],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleAddItem({ name: "Detergent", categoryId: "cat-1" }));
    expect(result.current.grouped[0].items).toHaveLength(1);
    expect(result.current.grouped[0].items[0].name).toBe("Detergent");
    expect(result.current.grouped[0].items[0].checked).toBe(false);
    expect(onSaveItems).toHaveBeenCalledOnce();
    const saved = onSaveItems.mock.calls[0][0] as ShoppingItem[];
    expect(saved).toHaveLength(1);
    expect(saved[0].categoryId).toBe("cat-1");
  });

  it("handleAddItem with blank name does nothing and does not call onSaveItems", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Cleaning" })];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: [],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleAddItem({ name: "   ", categoryId: "cat-1" }));
    expect(result.current.grouped[0].items).toHaveLength(0);
    expect(onSaveItems).not.toHaveBeenCalled();
  });

  it("handleEditItem with blank name does nothing and does not call onSaveItems", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Cleaning" })];
    const item = makeItem({ id: "item-1", name: "Detergent", categoryId: "cat-1" });
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: [item],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleEditItem("item-1", { name: "  ", categoryId: "cat-1" }));
    expect(result.current.grouped[0].items[0].name).toBe("Detergent");
    expect(onSaveItems).not.toHaveBeenCalled();
  });

  it("handleEditItem patches name and categoryId, preserves id and createdAt, calls onSaveItems", () => {
    const categories = [
      makeCategory({ id: "cat-1", name: "Cleaning" }),
      makeCategory({ id: "cat-2", name: "Supermarket" }),
    ];
    const item = makeItem({
      id: "item-1",
      name: "Old Name",
      categoryId: "cat-1",
      createdAt: "2026-01-01T00:00:00Z",
    });
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: [item],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() =>
      result.current.handleEditItem("item-1", { name: "New Name", categoryId: "cat-2" })
    );
    expect(result.current.grouped[0].items).toHaveLength(0);
    expect(result.current.grouped[1].items).toHaveLength(1);
    expect(result.current.grouped[1].items[0].name).toBe("New Name");
    expect(result.current.grouped[1].items[0].id).toBe("item-1");
    expect(result.current.grouped[1].items[0].createdAt).toBe("2026-01-01T00:00:00Z");
    expect(onSaveItems).toHaveBeenCalledOnce();
  });

  it("handleDeleteItem removes the item and calls onSaveItems", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Cleaning" })];
    const items = [
      makeItem({ id: "item-1", categoryId: "cat-1", name: "A" }),
      makeItem({ id: "item-2", categoryId: "cat-1", name: "B" }),
    ];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: items,
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleDeleteItem("item-1"));
    expect(result.current.grouped[0].items).toHaveLength(1);
    expect(result.current.grouped[0].items[0].id).toBe("item-2");
    expect(onSaveItems).toHaveBeenCalledOnce();
    const saved = onSaveItems.mock.calls[0][0] as ShoppingItem[];
    expect(saved).toHaveLength(1);
  });

  it("handleCheckItem immediately and permanently deletes the item, calls onSaveItems, and does not touch categories", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Cleaning" })];
    const items = [makeItem({ id: "item-1", categoryId: "cat-1", name: "Detergent" })];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: items,
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleCheckItem("item-1"));
    expect(result.current.grouped[0].items).toHaveLength(0);
    expect(onSaveItems).toHaveBeenCalledOnce();
    const saved = onSaveItems.mock.calls[0][0] as ShoppingItem[];
    expect(saved).toHaveLength(0);
    expect(onSaveCategories).not.toHaveBeenCalled();
  });

  it("stale-ref safety: handleAddItem then handleDeleteItem both apply, onSaveItems called twice", () => {
    const categories = [makeCategory({ id: "cat-1", name: "Cleaning" })];
    const { result } = renderHook(() =>
      useShoppingList({
        initialCategories: categories,
        initialItems: [],
        onSaveCategories,
        onSaveItems,
      })
    );
    act(() => result.current.handleAddItem({ name: "First", categoryId: "cat-1" }));
    const addedId = (onSaveItems.mock.calls[0][0] as ShoppingItem[])[0].id;
    act(() => result.current.handleDeleteItem(addedId));
    expect(result.current.grouped[0].items).toHaveLength(0);
    expect(onSaveItems).toHaveBeenCalledTimes(2);
  });
});

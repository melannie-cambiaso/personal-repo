import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWishlist } from "./useWishlist";
import type { WishlistItem } from "@/features/wishlist/domain/WishlistItem";
import { CATEGORIES } from "@/features/wishlist/data";

const makeItem = (id: string, price: number | null = 1000): WishlistItem => ({
  id,
  title: `Item ${id}`,
  brand: "Brand",
  description: "Desc",
  emoji: "🎁",
  category: CATEGORIES.tech,
  price,
});

describe("useWishlist", () => {
  it("returns initial items and owned ids", () => {
    const items = [makeItem("1"), makeItem("2")];
    const { result } = renderHook(() =>
      useWishlist({
        initialItems: items,
        initialOwnedIds: ["1"],
        onAdd: vi.fn(),
        onToggle: vi.fn(),
      })
    );
    expect(result.current.items).toHaveLength(2);
    expect(result.current.ownedIds.has("1")).toBe(true);
    expect(result.current.pending).toBe(1);
  });

  it("addItem prepends item and calls onAdd with full list", () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() =>
      useWishlist({ initialItems: [makeItem("1")], initialOwnedIds: [], onAdd, onToggle: vi.fn() })
    );
    act(() => result.current.addItem(makeItem("2")));
    expect(result.current.items[0].id).toBe("2");
    expect(result.current.items).toHaveLength(2);
    expect(onAdd).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "2" })])
    );
  });

  it("editItem replaces existing item in place", () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() =>
      useWishlist({
        initialItems: [makeItem("1"), makeItem("2")],
        initialOwnedIds: [],
        onAdd,
        onToggle: vi.fn(),
      })
    );
    const updated = { ...makeItem("1"), title: "Updated" };
    act(() => result.current.editItem(updated));
    expect(result.current.items.find((i) => i.id === "1")?.title).toBe("Updated");
    expect(result.current.items).toHaveLength(2);
    expect(onAdd).toHaveBeenCalled();
  });

  it("toggle adds id to ownedIds and updates pending", () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() =>
      useWishlist({
        initialItems: [makeItem("1"), makeItem("2")],
        initialOwnedIds: [],
        onAdd: vi.fn(),
        onToggle,
      })
    );
    act(() => result.current.toggle("1"));
    expect(result.current.ownedIds.has("1")).toBe(true);
    expect(result.current.pending).toBe(1);
    expect(onToggle).toHaveBeenCalledWith(["1"]);
  });

  it("toggle removes id when already owned", () => {
    const { result } = renderHook(() =>
      useWishlist({
        initialItems: [makeItem("1")],
        initialOwnedIds: ["1"],
        onAdd: vi.fn(),
        onToggle: vi.fn(),
      })
    );
    act(() => result.current.toggle("1"));
    expect(result.current.ownedIds.has("1")).toBe(false);
    expect(result.current.pending).toBe(1);
  });

  it("totalPrice sums pending items with non-null price", () => {
    const items = [makeItem("1", 5000), makeItem("2", 3000), makeItem("3", null)];
    const { result } = renderHook(() =>
      useWishlist({
        initialItems: items,
        initialOwnedIds: ["2"],
        onAdd: vi.fn(),
        onToggle: vi.fn(),
      })
    );
    expect(result.current.totalPrice).toBe(5000);
  });

  it("deleteItem removes item from items and calls onAdd", () => {
    const onAdd = vi.fn();
    const { result } = renderHook(() =>
      useWishlist({
        initialItems: [makeItem("1"), makeItem("2")],
        initialOwnedIds: [],
        onAdd,
        onToggle: vi.fn(),
      })
    );
    act(() => result.current.deleteItem("1"));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe("2");
    expect(onAdd).toHaveBeenCalledWith([expect.objectContaining({ id: "2" })]);
  });

  it("deleteItem removes id from ownedIds and calls onToggle", () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() =>
      useWishlist({
        initialItems: [makeItem("1"), makeItem("2")],
        initialOwnedIds: ["1"],
        onAdd: vi.fn(),
        onToggle,
      })
    );
    act(() => result.current.deleteItem("1"));
    expect(result.current.ownedIds.has("1")).toBe(false);
    expect(onToggle).toHaveBeenCalledWith([]);
  });

  it("deleteItem is a no-op when id not found", () => {
    const onAdd = vi.fn();
    const onToggle = vi.fn();
    const { result } = renderHook(() =>
      useWishlist({ initialItems: [makeItem("1")], initialOwnedIds: [], onAdd, onToggle })
    );
    act(() => result.current.deleteItem("Z"));
    expect(result.current.items).toHaveLength(1);
    expect(onAdd).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import { summarizeWishlist } from "./summarizeWishlist";
import type { WishlistItem, WishlistPriority } from "./WishlistItem";

const item = (
  id: string,
  title: string,
  price: number | null,
  priority?: WishlistPriority
): WishlistItem => ({
  id,
  title,
  price,
  ...(priority && { priority }),
});

const ids = (items: WishlistItem[]) => items.map((i) => i.id);

describe("summarizeWishlist", () => {
  it("returns zeros and no top items for an empty list", () => {
    expect(summarizeWishlist([], new Set())).toEqual({ pendingCount: 0, total: 0, topHigh: [] });
  });

  it("counts pending items and sums their prices, skipping owned and null-price items", () => {
    const items = [
      item("1", "Auriculares", 5000),
      item("2", "Bicicleta", 150000),
      item("3", "Cámara", null),
      item("4", "Drone", 80000),
    ];

    const result = summarizeWishlist(items, new Set(["2"]));

    expect(result.pendingCount).toBe(3);
    expect(result.total).toBe(85000);
  });

  it("lists only pending Alta items in manual (array) order", () => {
    const items = [
      item("1", "Zapatillas", 30000, "high"),
      item("2", "Bicicleta", 150000, "high"),
      item("3", "Auriculares", 5000, "high"),
      item("4", "Cámara", 1000, "medium"),
      item("5", "Drone", 100, "low"),
    ];

    const result = summarizeWishlist(items, new Set(["2"]));

    expect(ids(result.topHigh)).toEqual(["1", "3"]);
  });

  it("keeps a pricier Alta item first when it comes first in the array", () => {
    const items = [item("1", "Caro", 900000, "high"), item("2", "Barato", 10, "high")];

    expect(ids(summarizeWishlist(items, new Set()).topHigh)).toEqual(["1", "2"]);
  });

  it("caps the top list at 3 by default and honours a custom limit", () => {
    const items = [
      item("1", "D", 400, "high"),
      item("2", "C", 300, "high"),
      item("3", "B", 200, "high"),
      item("4", "A", 100, "high"),
    ];

    expect(ids(summarizeWishlist(items, new Set()).topHigh)).toEqual(["1", "2", "3"]);
    expect(ids(summarizeWishlist(items, new Set(), 1).topHigh)).toEqual(["1"]);
  });

  it("does not treat legacy items without priority as Alta", () => {
    const items = [item("1", "Legacy", 100), item("2", "Nuevo", 200, "high")];

    expect(ids(summarizeWishlist(items, new Set()).topHigh)).toEqual(["2"]);
  });
});

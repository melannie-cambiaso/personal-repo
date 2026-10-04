import { describe, expect, it } from "vitest";
import { flattenWishlistGroups, moveItem, orderWishlist } from "./orderWishlist";
import type { WishlistItem, WishlistPriority } from "./WishlistItem";

const item = (
  id: string,
  priority?: WishlistPriority,
  price: number | null = 100
): WishlistItem => ({
  id,
  title: `Item ${id}`,
  price,
  ...(priority && { priority }),
});

const ids = (items: WishlistItem[]) => items.map((i) => i.id);

describe("orderWishlist", () => {
  it("returns empty groups for an empty list", () => {
    expect(orderWishlist([], new Set())).toEqual({ high: [], medium: [], low: [], owned: [] });
  });

  it("splits pending items by priority, keeping array order within each group", () => {
    const items = [
      item("1", "low"),
      item("2", "high", 900),
      item("3", "medium"),
      item("4", "high", 10),
      item("5", "low"),
    ];

    const groups = orderWishlist(items, new Set());

    expect(ids(groups.high)).toEqual(["2", "4"]);
    expect(ids(groups.medium)).toEqual(["3"]);
    expect(ids(groups.low)).toEqual(["1", "5"]);
    expect(groups.owned).toEqual([]);
  });

  it("places legacy items without priority in medium, in array order", () => {
    const items = [item("1", "medium"), item("2"), item("3", "high")];

    expect(ids(orderWishlist(items, new Set()).medium)).toEqual(["1", "2"]);
  });

  it("collects owned items in array order and excludes them from priority groups", () => {
    const items = [item("1", "high"), item("2", "low"), item("3", "high"), item("4")];

    const groups = orderWishlist(items, new Set(["3", "2"]));

    expect(ids(groups.high)).toEqual(["1"]);
    expect(ids(groups.low)).toEqual([]);
    expect(ids(groups.medium)).toEqual(["4"]);
    expect(ids(groups.owned)).toEqual(["2", "3"]);
  });
});

describe("flattenWishlistGroups", () => {
  it("concatenates high, medium, low, then owned", () => {
    const items = [item("1", "low"), item("2"), item("3", "high"), item("4", "high")];

    const flat = flattenWishlistGroups(orderWishlist(items, new Set(["4"])));

    expect(ids(flat)).toEqual(["3", "2", "1", "4"]);
  });
});

describe("moveItem", () => {
  // Array: high H1, low L1, medium M1, high H2, low L2, high H3
  const items = [
    item("H1", "high"),
    item("L1", "low"),
    item("M1"),
    item("H2", "high"),
    item("L2", "low"),
    item("H3", "high"),
  ];

  it("moves an item up by swapping with the previous same-group item across other groups", () => {
    const result = moveItem(items, new Set(), "H2", "up");

    expect(ids(result)).toEqual(["H2", "L1", "M1", "H1", "L2", "H3"]);
  });

  it("moves an item down by swapping with the next same-group item across other groups", () => {
    const result = moveItem(items, new Set(), "L1", "down");

    expect(ids(result)).toEqual(["H1", "L2", "M1", "H2", "L1", "H3"]);
  });

  it("skips owned items when looking for the same-group neighbour", () => {
    const result = moveItem(items, new Set(["H2"]), "H3", "up");

    expect(ids(result)).toEqual(["H3", "L1", "M1", "H2", "L2", "H1"]);
  });

  it("treats legacy items as medium when finding neighbours", () => {
    const list = [item("M1", "medium"), item("H1", "high"), item("X")];

    expect(ids(moveItem(list, new Set(), "X", "up"))).toEqual(["X", "H1", "M1"]);
  });

  it("returns the same array when the item is at the edge of its group", () => {
    expect(moveItem(items, new Set(), "H1", "up")).toBe(items);
    expect(moveItem(items, new Set(), "H3", "down")).toBe(items);
    expect(moveItem(items, new Set(), "M1", "up")).toBe(items);
    expect(moveItem(items, new Set(), "M1", "down")).toBe(items);
  });

  it("returns the same array when the item is owned", () => {
    expect(moveItem(items, new Set(["H2"]), "H2", "up")).toBe(items);
    expect(moveItem(items, new Set(["H2"]), "H2", "down")).toBe(items);
  });

  it("returns the same array when the id is unknown", () => {
    expect(moveItem(items, new Set(), "nope", "up")).toBe(items);
  });

  it("never mutates the input array", () => {
    const before = ids(items);

    const result = moveItem(items, new Set(), "H2", "down");

    expect(result).not.toBe(items);
    expect(ids(items)).toEqual(before);
  });
});

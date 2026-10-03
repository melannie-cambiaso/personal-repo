import { describe, expect, it } from "vitest";
import { sortItems } from "./sortItems";
import type { WishlistItem, WishlistPriority } from "./WishlistItem";
import { CATEGORIES } from "@/features/wishlist/data";

const item = (
  id: string,
  title: string,
  price: number | null,
  priority?: WishlistPriority
): WishlistItem => ({
  id,
  title,
  brand: "Brand",
  description: "Desc",
  emoji: "🎁",
  category: CATEGORIES.tech,
  price,
  ...(priority && { priority }),
});

const A = item("1", "Auriculares", 5000);
const B = item("2", "Bicicleta", 150000);
const C = item("3", "Cámara", null);

describe("sortItems", () => {
  it("default returns items in original order", () => {
    const result = sortItems([B, A, C], "default");
    expect(result.map((i) => i.id)).toEqual(["2", "1", "3"]);
  });

  it("name-asc sorts alphabetically ascending", () => {
    const result = sortItems([B, C, A], "name-asc");
    expect(result.map((i) => i.title)).toEqual(["Auriculares", "Bicicleta", "Cámara"]);
  });

  it("name-desc sorts alphabetically descending", () => {
    const result = sortItems([A, B, C], "name-desc");
    expect(result.map((i) => i.title)).toEqual(["Cámara", "Bicicleta", "Auriculares"]);
  });

  it("price-asc sorts ascending with null prices last", () => {
    const result = sortItems([C, B, A], "price-asc");
    expect(result.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });

  it("price-desc sorts descending with null prices last", () => {
    const result = sortItems([A, C, B], "price-desc");
    expect(result.map((i) => i.id)).toEqual(["2", "1", "3"]);
  });

  it("does not mutate the original array", () => {
    const original = [B, A, C];
    sortItems(original, "name-asc");
    expect(original.map((i) => i.id)).toEqual(["2", "1", "3"]);
  });

  describe("priority", () => {
    const high = item("h", "Zapatillas", 9000, "high");
    const low = item("l", "Agenda", 100, "low");
    const legacy = item("m", "Mate", 2000);

    it("sorts high → medium → low", () => {
      const result = sortItems([low, legacy, high], "priority");
      expect(result.map((i) => i.id)).toEqual(["h", "m", "l"]);
    });

    it("treats an item without priority as medium", () => {
      const explicitMedium = item("x", "Mochila", 3000, "medium");
      const result = sortItems([explicitMedium, low, legacy], "priority");
      expect(result.map((i) => i.id)).toEqual(["m", "x", "l"]);
    });

    it("breaks ties by price ascending with null prices last, then by title", () => {
      const pricey = item("p", "Bicicleta", 150000, "high");
      const cheap = item("c", "Auriculares", 5000, "high");
      const unpriced = item("u", "Cámara", null, "high");
      const sameTitleTie = item("s", "Anteojos", 5000, "high");
      const result = sortItems([unpriced, pricey, cheap, sameTitleTie], "priority");
      expect(result.map((i) => i.id)).toEqual(["s", "c", "p", "u"]);
    });
  });

  describe("owned items", () => {
    const owned = new Set(["1"]);

    it.each([
      ["default", ["2", "3", "1"]],
      ["priority", ["2", "3", "1"]],
      ["name-asc", ["2", "3", "1"]],
      ["name-desc", ["3", "2", "1"]],
      ["price-asc", ["2", "3", "1"]],
      ["price-desc", ["2", "3", "1"]],
    ] as const)("go last with %s", (key, expected) => {
      const result = sortItems([B, A, C], key, owned);
      expect(result.map((i) => i.id)).toEqual(expected);
    });

    it("keep the chosen order within the owned group", () => {
      const result = sortItems([A, B, C], "price-desc", new Set(["1", "2"]));
      expect(result.map((i) => i.id)).toEqual(["3", "2", "1"]);
    });

    it("leave the order untouched when no ids are owned", () => {
      const result = sortItems([B, A, C], "name-asc", new Set());
      expect(result.map((i) => i.title)).toEqual(["Auriculares", "Bicicleta", "Cámara"]);
    });
  });
});

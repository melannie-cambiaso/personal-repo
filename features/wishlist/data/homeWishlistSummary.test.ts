import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WishlistItem } from "@/features/wishlist/domain";
import { CATEGORIES } from "./categories";

const loadItemsMock = vi.hoisted(() => vi.fn());
const loadOwnedIdsMock = vi.hoisted(() => vi.fn());

vi.mock("./kvAdapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./kvAdapter")>();
  return {
    ...actual,
    loadItems: loadItemsMock,
    loadOwnedIds: loadOwnedIdsMock,
  };
});

import { loadHomeWishlistSummary } from "./homeWishlistSummary";

const item = (
  id: string,
  title: string,
  price: number | null,
  priority?: WishlistItem["priority"]
): WishlistItem => ({
  id,
  title,
  category: CATEGORIES.tech,
  price,
  ...(priority && { priority }),
});

describe("loadHomeWishlistSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("summarizes the stored items against the stored owned ids", async () => {
    const auriculares = item("1", "Auriculares", 5000, "high");
    const bicicleta = item("2", "Bicicleta", 150000, "high");
    const camara = item("3", "Cámara", null, "high");
    const drone = item("4", "Drone", 800, "low");
    loadItemsMock.mockResolvedValue([auriculares, bicicleta, camara, drone]);
    loadOwnedIdsMock.mockResolvedValue(new Set(["2"]));

    const result = await loadHomeWishlistSummary();

    expect(result).toEqual({
      pendingCount: 3,
      total: 5800,
      topHigh: [auriculares, camara],
    });
  });

  it("returns an empty summary when nothing is stored", async () => {
    loadItemsMock.mockResolvedValue([]);
    loadOwnedIdsMock.mockResolvedValue(new Set());

    const result = await loadHomeWishlistSummary();

    expect(result).toEqual({ pendingCount: 0, total: 0, topHigh: [] });
  });
});

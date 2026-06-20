import { describe, expect, it } from "vitest"
import { sortItems } from "./sortItems"
import type { WishlistItem } from "./WishlistItem"
import { CATEGORIES } from "@/features/wishlist/data"

const item = (id: string, title: string, price: number | null): WishlistItem => ({
  id,
  title,
  brand: "Brand",
  description: "Desc",
  emoji: "🎁",
  category: CATEGORIES.tech,
  price,
})

const A = item("1", "Auriculares", 5000)
const B = item("2", "Bicicleta", 150000)
const C = item("3", "Cámara", null)

describe("sortItems", () => {
  it("default returns items in original order", () => {
    const result = sortItems([B, A, C], "default")
    expect(result.map((i) => i.id)).toEqual(["2", "1", "3"])
  })

  it("name-asc sorts alphabetically ascending", () => {
    const result = sortItems([B, C, A], "name-asc")
    expect(result.map((i) => i.title)).toEqual(["Auriculares", "Bicicleta", "Cámara"])
  })

  it("name-desc sorts alphabetically descending", () => {
    const result = sortItems([A, B, C], "name-desc")
    expect(result.map((i) => i.title)).toEqual(["Cámara", "Bicicleta", "Auriculares"])
  })

  it("price-asc sorts ascending with null prices last", () => {
    const result = sortItems([C, B, A], "price-asc")
    expect(result.map((i) => i.id)).toEqual(["1", "2", "3"])
  })

  it("price-desc sorts descending with null prices last", () => {
    const result = sortItems([A, C, B], "price-desc")
    expect(result.map((i) => i.id)).toEqual(["2", "1", "3"])
  })

  it("does not mutate the original array", () => {
    const original = [B, A, C]
    sortItems(original, "name-asc")
    expect(original.map((i) => i.id)).toEqual(["2", "1", "3"])
  })
})

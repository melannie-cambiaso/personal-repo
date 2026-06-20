import type { WishlistItem } from "./WishlistItem"

export type SortKey = "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc"

export function sortItems(items: WishlistItem[], key: SortKey): WishlistItem[] {
  if (key === "default") return items
  const sorted = [...items]
  if (key === "name-asc") return sorted.sort((a, b) => a.title.localeCompare(b.title))
  if (key === "name-desc") return sorted.sort((a, b) => b.title.localeCompare(a.title))
  if (key === "price-asc") {
    const asc = (i: WishlistItem) => (i.price === null ? Infinity : i.price)
    return sorted.sort((a, b) => asc(a) - asc(b))
  }
  // ponytail: -Infinity keeps null prices last in descending order
  const desc = (i: WishlistItem) => (i.price === null ? -Infinity : i.price)
  return sorted.sort((a, b) => desc(b) - desc(a))
}

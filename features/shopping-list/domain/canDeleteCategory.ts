import type { ShoppingItem } from "./ShoppingItem";

export function canDeleteCategory(categoryId: string, items: ShoppingItem[]): boolean {
  return !items.some((item) => item.categoryId === categoryId);
}

import type { ShoppingCategory } from "./ShoppingCategory";
import type { ShoppingItem } from "./ShoppingItem";

export interface CategoryGroup {
  category: ShoppingCategory;
  items: ShoppingItem[];
}

export function groupItemsByCategory(
  categories: ShoppingCategory[],
  items: ShoppingItem[]
): CategoryGroup[] {
  return categories.map((category) => ({
    category,
    items: items.filter((item) => item.categoryId === category.id),
  }));
}

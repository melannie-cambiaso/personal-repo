import "server-only";
import { redis } from "@/shared/kv";
import type { ShoppingCategory } from "../domain/ShoppingCategory";
import type { ShoppingItem } from "../domain/ShoppingItem";

const CATEGORIES_KEY = "shopping-list-categories";

export async function loadCategories(): Promise<ShoppingCategory[]> {
  try {
    return (await redis.get<ShoppingCategory[]>(CATEGORIES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveCategories(categories: ShoppingCategory[]): Promise<void> {
  try {
    await redis.set(CATEGORIES_KEY, categories);
  } catch (e) {
    console.error("shoppingList.saveCategories failed", e);
  }
}

const ITEMS_KEY = "shopping-list-items";

export async function loadItems(): Promise<ShoppingItem[]> {
  try {
    return (await redis.get<ShoppingItem[]>(ITEMS_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveItems(items: ShoppingItem[]): Promise<void> {
  try {
    await redis.set(ITEMS_KEY, items);
  } catch (e) {
    console.error("shoppingList.saveItems failed", e);
  }
}

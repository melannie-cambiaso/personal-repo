"use server";

import { cookies } from "next/headers";
import { saveCategories, saveItems } from "./kvAdapter";
import type { ShoppingCategory } from "../domain/ShoppingCategory";
import type { ShoppingItem } from "../domain/ShoppingItem";

export async function handleSaveCategories(categories: ShoppingCategory[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveCategories(categories);
}

export async function handleSaveItems(items: ShoppingItem[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveItems(items);
}

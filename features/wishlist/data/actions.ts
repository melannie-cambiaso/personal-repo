"use server";

import { cookies } from "next/headers";
import { isValidToken } from "./auth";
import { saveItems, saveOwnedIds } from "./kvAdapter";
import type { WishlistItem } from "../domain/WishlistItem";

export async function persistItems(items: WishlistItem[]): Promise<{ success: boolean }> {
  const token = (await cookies()).get("wishlist_auth")?.value;
  if (!isValidToken(token)) return { success: false };
  await saveItems(items);
  return { success: true };
}

export async function persistOwnedIds(ownedIds: string[]): Promise<{ success: boolean }> {
  const token = (await cookies()).get("wishlist_auth")?.value;
  if (!isValidToken(token)) return { success: false };
  await saveOwnedIds(new Set(ownedIds));
  return { success: true };
}

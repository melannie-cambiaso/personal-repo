"use server";

import { cookies } from "next/headers";
import { saveEntries } from "./kvAdapter";
import type { SavingsEntry } from "../domain/SavingsEntry";

export async function handleSave(entries: SavingsEntry[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveEntries(entries);
}

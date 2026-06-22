"use server";

import { cookies } from "next/headers";
import { saveEntries } from "./kvAdapter";
import type { FinanceEntry } from "../domain/FinanceEntry";

export async function handleSave(entries: FinanceEntry[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveEntries(entries);
}

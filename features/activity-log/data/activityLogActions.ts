"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { loadEntries, saveEntries } from "./kvAdapter";
import type { ActivityLogEntry, Person } from "../domain/ActivityLogEntry";

async function requireAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!cookieStore.get("wishlist_auth")?.value;
}

export async function addActivityEntry(data: {
  date: string;
  person: Person;
  activity: string;
  notes?: string;
}): Promise<void> {
  if (!await requireAuth()) return;

  if (!data.activity.trim()) {
    throw new Error("Activity must not be empty");
  }

  const month = data.date.slice(0, 7);
  const newEntry: ActivityLogEntry = {
    id: crypto.randomUUID(),
    date: data.date,
    person: data.person,
    activity: data.activity,
    notes: data.notes,
    createdAt: new Date().toISOString(),
  };

  const entries = await loadEntries(month);
  entries.push(newEntry);
  await saveEntries(month, entries);
  revalidatePath("/activity-log");
}

export async function deleteActivityEntry(
  id: string,
  month: string,
): Promise<void> {
  if (!await requireAuth()) return;

  const entries = await loadEntries(month);
  const filtered = entries.filter((e) => e.id !== id);
  await saveEntries(month, filtered);
  revalidatePath("/activity-log");
}

export async function getEntriesForMonth(
  month: string,
): Promise<ActivityLogEntry[]> {
  if (!await requireAuth()) return [];
  return loadEntries(month);
}

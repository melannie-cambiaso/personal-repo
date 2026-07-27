"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { loadEntries, saveEntries, saveGoals, loadPeriods, savePeriods } from "./kvAdapter";
import type { SavingsEntry } from "../domain/SavingsEntry";
import type { SavingsGoal } from "../domain/SavingsGoal";
import { resolveActivePeriod, resolveEntryPeriodId, type SavingsPeriod } from "../domain/SavingsPeriod";

/**
 * Server-authoritative save: the active period's id is re-derived from KV,
 * never trusted from the client. Entries already belonging to a closed
 * period (by id, per KV) are re-read from storage and persisted unchanged —
 * whatever the client sends for them is ignored. Every other client-submitted
 * entry is stamped with the current active period's id, so a payload trying
 * to target a closed period's id is silently overridden.
 */
export async function handleSave(entries: SavingsEntry[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;

  const periods = await loadPeriods();
  const active = resolveActivePeriod(periods);

  const existingEntries = await loadEntries();
  const archived = existingEntries.filter((e) => resolveEntryPeriodId(e) !== active.id);
  const archivedIds = new Set(archived.map((e) => e.id));

  const stampedClientEntries = entries
    .filter((e) => !archivedIds.has(e.id))
    .map((e) => ({ ...e, periodId: active.id }));

  await saveEntries([...archived, ...stampedClientEntries]);
}

/**
 * Closes the current active period (stamping any of its untagged/legacy
 * entries with its own id, materializing the bootstrap period on first use)
 * and opens a new active period. `initialAmount`/`startedAt` for the closing
 * period are carried over unchanged, not re-derived from the caller — this
 * is defense in depth alongside `savePeriods`' own merge-guard.
 */
export async function handleArchiveAndStartPeriod(options: {
  initialAmount?: number;
  label?: string;
}): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;

  const periods = await loadPeriods();
  const active = resolveActivePeriod(periods);
  const now = new Date().toISOString();

  const closedActive: SavingsPeriod = { ...active, closedAt: now };
  const nextPeriods = periods.some((p) => p.id === active.id)
    ? periods.map((p) => (p.id === active.id ? closedActive : p))
    : [...periods, closedActive];

  const newPeriod: SavingsPeriod = {
    id: crypto.randomUUID(),
    startedAt: now,
    initialAmount: options.initialAmount ?? 0,
    ...(options.label?.trim() && { label: options.label.trim() }),
  };

  const entries = await loadEntries();
  const stampedEntries = entries.map((e) =>
    resolveEntryPeriodId(e) === active.id ? { ...e, periodId: active.id } : e
  );

  await savePeriods([...nextPeriods, newPeriod]);
  await saveEntries(stampedEntries);
  revalidatePath("/savings");
}

export async function handleSaveGoals(goals: SavingsGoal[]): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return;
  await saveGoals(goals);
}

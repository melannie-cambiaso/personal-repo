import "server-only";
import { redis } from "@/shared/kv";
import type { Zone } from "../domain/Zone";
import type { ImprovementItem } from "../domain/ImprovementItem";

const ZONES_KEY = "home-improvements-zones";
const ITEMS_KEY = "home-improvements-items";

export async function loadZones(): Promise<Zone[]> {
  try {
    return (await redis.get<Zone[]>(ZONES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveZones(zones: Zone[]): Promise<void> {
  try {
    await redis.set(ZONES_KEY, zones);
  } catch (e) {
    console.error("home-improvements.saveZones failed", e);
  }
}

export async function loadItems(): Promise<ImprovementItem[]> {
  try {
    return (await redis.get<ImprovementItem[]>(ITEMS_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveItems(items: ImprovementItem[]): Promise<void> {
  try {
    await redis.set(ITEMS_KEY, items);
  } catch (e) {
    console.error("home-improvements.saveItems failed", e);
  }
}

import type { ImprovementItem } from "./ImprovementItem";

export function totalCostByZone(items: ImprovementItem[]): Map<string, number> {
  return items
    .filter((item) => !item.done)
    .reduce((map, item) => {
      map.set(item.zoneId, (map.get(item.zoneId) ?? 0) + (item.estimatedCost ?? 0) * (item.quantity ?? 1));
      return map;
    }, new Map<string, number>());
}

export function itemsPlannedForMonth(items: ImprovementItem[], month: string): ImprovementItem[] {
  return items.filter((i) => !i.done && i.plannedMonth === month);
}

export function itemsUnassigned(items: ImprovementItem[]): ImprovementItem[] {
  return items.filter((i) => !i.done && !i.plannedMonth);
}

export function pendingCountByZone(items: ImprovementItem[]): Map<string, number> {
  return items.reduce((map, item) => {
    if (!item.done) map.set(item.zoneId, (map.get(item.zoneId) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
}

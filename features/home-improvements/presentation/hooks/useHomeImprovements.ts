"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import { totalCostByZone, pendingCountByZone } from "@/features/home-improvements/domain";

interface Params {
  initialZones: Zone[];
  initialItems: ImprovementItem[];
  onSaveZones: (zones: Zone[]) => Promise<void> | void;
  onSaveItems: (items: ImprovementItem[]) => Promise<void> | void;
}

export function useHomeImprovements({
  initialZones,
  initialItems,
  onSaveZones,
  onSaveItems,
}: Params) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [items, setItems] = useState<ImprovementItem[]>(initialItems);
  const zonesRef = useRef(initialZones);
  const itemsRef = useRef(initialItems);

  useEffect(() => { zonesRef.current = zones; }, [zones]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const itemsByZone = useMemo(
    () =>
      items.reduce((map, item) => {
        map.set(item.zoneId, [...(map.get(item.zoneId) ?? []), item]);
        return map;
      }, new Map<string, ImprovementItem[]>()),
    [items],
  );

  const costByZone = useMemo(() => totalCostByZone(items), [items]);
  const pendingByZone = useMemo(() => pendingCountByZone(items), [items]);

  // Zones

  const addZone = (zone: Zone): boolean => {
    const name = zone.name.trim().toLowerCase();
    if (zonesRef.current.some((z) => z.name.trim().toLowerCase() === name)) return false;
    const next = [...zonesRef.current, zone];
    zonesRef.current = next;
    setZones(next);
    void onSaveZones(next);
    return true;
  };

  const editZone = (zone: Zone): boolean => {
    const name = zone.name.trim().toLowerCase();
    if (zonesRef.current.some((z) => z.id !== zone.id && z.name.trim().toLowerCase() === name)) return false;
    const next = zonesRef.current.map((z) => (z.id === zone.id ? zone : z));
    zonesRef.current = next;
    setZones(next);
    void onSaveZones(next);
    return true;
  };

  const deleteZone = (zoneId: string) => {
    const nextZones = zonesRef.current.filter((z) => z.id !== zoneId);
    const nextItems = itemsRef.current.filter((i) => i.zoneId !== zoneId);
    zonesRef.current = nextZones;
    itemsRef.current = nextItems;
    setZones(nextZones);
    setItems(nextItems);
    void onSaveZones(nextZones);
    void onSaveItems(nextItems);
  };

  // Items

  const addItem = (item: ImprovementItem) => {
    const next = [...itemsRef.current, item];
    itemsRef.current = next;
    setItems(next);
    void onSaveItems(next);
  };

  const editItem = (item: ImprovementItem) => {
    const next = itemsRef.current.map((i) => (i.id === item.id ? item : i));
    itemsRef.current = next;
    setItems(next);
    void onSaveItems(next);
  };

  const toggleDone = (itemId: string) => {
    const next = itemsRef.current.map((i) =>
      i.id === itemId ? { ...i, done: !i.done } : i,
    );
    itemsRef.current = next;
    setItems(next);
    void onSaveItems(next);
  };

  const assignToMonth = (itemId: string, month: string) => {
    const item = itemsRef.current.find((i) => i.id === itemId);
    if (!item) return;
    editItem({ ...item, plannedMonth: month });
  };

  const unassignFromMonth = (itemId: string) => {
    const item = itemsRef.current.find((i) => i.id === itemId);
    if (!item) return;
    const { plannedMonth: _, ...rest } = item;
    editItem(rest as ImprovementItem);
  };

  const deleteItem = (itemId: string) => {
    const next = itemsRef.current.filter((i) => i.id !== itemId);
    itemsRef.current = next;
    setItems(next);
    void onSaveItems(next);
  };

  return {
    zones,
    items,
    itemsByZone,
    costByZone,
    pendingByZone,
    addZone,
    editZone,
    deleteZone,
    addItem,
    editItem,
    toggleDone,
    deleteItem,
    assignToMonth,
    unassignFromMonth,
  };
}

"use client";

import type { Zone } from "@/features/home-improvements/domain/Zone";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import { ZoneCard } from "../ZoneCard/ZoneCard";

interface Props {
  zones: Zone[];
  itemsByZone: Map<string, ImprovementItem[]>;
  costByZone: Map<string, number>;
  pendingByZone: Map<string, number>;
  isOwner: boolean;
  onEditZone: (zone: Zone) => void;
  onDeleteZone: (zone: Zone) => void;
  onAddItem: (zoneId: string) => void;
  onEditItem: (item: ImprovementItem) => void;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export function ZoneList({
  zones,
  itemsByZone,
  costByZone,
  pendingByZone,
  isOwner,
  onEditZone,
  onDeleteZone,
  onAddItem,
  onEditItem,
  onToggleItem,
  onDeleteItem,
}: Props) {
  if (zones.length === 0) {
    return (
      <div className="text-brown-400 py-16 text-center">
        <p className="mb-1 text-4xl">🏠</p>
        <p className="text-sm">Todavía no hay zonas. ¡Agregá la primera!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {zones.map((zone) => (
        <ZoneCard
          key={zone.id}
          zone={zone}
          items={itemsByZone.get(zone.id) ?? []}
          totalCost={costByZone.get(zone.id) ?? 0}
          pendingCount={pendingByZone.get(zone.id) ?? 0}
          isOwner={isOwner}
          onEditZone={() => onEditZone(zone)}
          onDeleteZone={() => onDeleteZone(zone)}
          onAddItem={() => onAddItem(zone.id)}
          onEditItem={onEditItem}
          onToggleItem={onToggleItem}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </div>
  );
}

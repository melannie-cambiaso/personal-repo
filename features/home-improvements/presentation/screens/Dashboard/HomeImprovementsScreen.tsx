"use client";

import { useState } from "react";
import type { Zone } from "@/features/home-improvements/domain/Zone";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import { useHomeImprovements } from "../../hooks/useHomeImprovements";
import {
  ZoneList,
  AddZoneModal,
  EditZoneModal,
  AddItemModal,
  EditItemModal,
  DeleteZoneConfirmModal,
} from "../../components";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { AddButton } from "@/shared/components/AddButton/AddButton";

interface Props {
  initialZones: Zone[];
  initialItems: ImprovementItem[];
  isOwner: boolean;
  onSaveZones: (zones: Zone[]) => Promise<void> | void;
  onSaveItems: (items: ImprovementItem[]) => Promise<void> | void;
}

export function HomeImprovementsScreen({
  initialZones,
  initialItems,
  isOwner,
  onSaveZones,
  onSaveItems,
}: Props) {
  const {
    zones, items, itemsByZone, costByZone, pendingByZone,
    addZone, editZone, deleteZone, addItem, editItem, toggleDone, deleteItem,
  } = useHomeImprovements({ initialZones, initialItems, onSaveZones, onSaveItems });

  type SortKey = "price-asc" | "price-desc" | "name-asc" | "name-desc";
  const [sortBy, setSortBy] = useState<SortKey>("price-asc");

  const sortedZones = [...zones].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    const ca = costByZone.get(a.id) ?? 0;
    const cb = costByZone.get(b.id) ?? 0;
    return sortBy === "price-asc" ? ca - cb : cb - ca;
  });

  const [addZoneOpen, setAddZoneOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [pendingDeleteZone, setPendingDeleteZone] = useState<Zone | null>(null);
  const [addItemZoneId, setAddItemZoneId] = useState<string | undefined>();
  const [editingItem, setEditingItem] = useState<ImprovementItem | null>(null);

  const tryDeleteZone = (zone: Zone) => {
    const count = itemsByZone.get(zone.id)?.length ?? 0;
    if (count > 0) setPendingDeleteZone(zone);
    else deleteZone(zone.id);
  };

  const totalPending = items.filter((i) => !i.done).length;
  const totalCost = items.reduce((sum, i) => sum + (i.estimatedCost ?? 0), 0);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tu hogar" title="Mejoras">
        <div className="flex justify-center gap-6 text-sm text-cream-100/80">
          <span>{totalPending} pendiente{totalPending !== 1 ? "s" : ""}</span>
          {totalCost > 0 && <span>· ${totalCost.toLocaleString("es-AR")} estimado</span>}
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="cursor-pointer rounded-lg border border-cream-400 bg-white px-3 py-2 text-sm text-brown-900 outline-none transition-colors focus:border-brown-600"
          >
            <option value="price-asc">Precio ↑</option>
            <option value="price-desc">Precio ↓</option>
            <option value="name-asc">Nombre A→Z</option>
            <option value="name-desc">Nombre Z→A</option>
          </select>
          {isOwner && <AddButton onClick={() => setAddZoneOpen(true)} label="Agregar zona" />}
        </div>

        <ZoneList
          zones={sortedZones}
          itemsByZone={itemsByZone}
          costByZone={costByZone}
          pendingByZone={pendingByZone}
          isOwner={isOwner}
          onEditZone={setEditingZone}
          onDeleteZone={tryDeleteZone}
          onAddItem={(zoneId) => setAddItemZoneId(zoneId)}
          onEditItem={setEditingItem}
          onToggleItem={toggleDone}
          onDeleteItem={deleteItem}
        />
      </div>

      <AddZoneModal
        isOpen={addZoneOpen}
        onClose={() => setAddZoneOpen(false)}
        onAdd={addZone}
      />
      <EditZoneModal
        isOpen={editingZone !== null}
        zone={editingZone}
        onClose={() => setEditingZone(null)}
        onSave={editZone}
      />
      <AddItemModal
        isOpen={addItemZoneId !== undefined}
        zones={zones}
        preselectedZoneId={addItemZoneId}
        onClose={() => setAddItemZoneId(undefined)}
        onAdd={(item) => { addItem(item); setAddItemZoneId(undefined); }}
      />
      <EditItemModal
        isOpen={editingItem !== null}
        item={editingItem}
        zones={zones}
        onClose={() => setEditingItem(null)}
        onSave={(item) => { editItem(item); setEditingItem(null); }}
      />
      <DeleteZoneConfirmModal
        zone={pendingDeleteZone}
        itemCount={itemsByZone.get(pendingDeleteZone?.id ?? "")?.length ?? 0}
        onConfirm={() => { deleteZone(pendingDeleteZone!.id); setPendingDeleteZone(null); }}
        onCancel={() => setPendingDeleteZone(null)}
      />
    </main>
  );
}

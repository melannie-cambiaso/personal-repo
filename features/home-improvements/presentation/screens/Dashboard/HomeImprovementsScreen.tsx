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
import { PageHeader, AddButton, ModalShell, Select } from "@/shared/components";
import { formatCLP } from "@/shared/utils/formatCurrency";

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
  const totalCost = items
    .filter((i) => !i.done)
    .reduce((sum, i) => sum + (i.estimatedCost ?? 0) * (i.quantity ?? 1), 0);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Tu hogar" title="Mejoras">
        <div className="text-cream-100/80 flex justify-center gap-6 text-sm">
          <span>
            {totalPending} pendiente{totalPending !== 1 ? "s" : ""}
          </span>
          {totalCost > 0 && <span>· {formatCLP(totalCost)} estimado</span>}
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="cursor-pointer"
            options={[
              { value: "price-asc", label: "Precio ↑" },
              { value: "price-desc", label: "Precio ↓" },
              { value: "name-asc", label: "Nombre A→Z" },
              { value: "name-desc", label: "Nombre Z→A" },
            ]}
          />
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
        key={addZoneOpen ? "zone-open" : "zone-closed"}
        isOpen={addZoneOpen}
        onClose={() => setAddZoneOpen(false)}
        onAdd={addZone}
      />
      <EditZoneModal
        key={editingZone?.id}
        zone={editingZone}
        onClose={() => setEditingZone(null)}
        onSave={editZone}
      />
      <AddItemModal
        key={addItemZoneId ?? "closed"}
        isOpen={addItemZoneId !== undefined}
        zones={zones}
        preselectedZoneId={addItemZoneId}
        onClose={() => setAddItemZoneId(undefined)}
        onAdd={(item) => {
          addItem(item);
          setAddItemZoneId(undefined);
        }}
      />
      <EditItemModal
        key={editingItem?.id}
        item={editingItem}
        zones={zones}
        onClose={() => setEditingItem(null)}
        onSave={(item) => {
          editItem(item);
          setEditingItem(null);
        }}
      />
      <DeleteZoneConfirmModal
        zone={pendingDeleteZone}
        itemCount={itemsByZone.get(pendingDeleteZone?.id ?? "")?.length ?? 0}
        onConfirm={() => {
          deleteZone(pendingDeleteZone!.id);
          setPendingDeleteZone(null);
        }}
        onCancel={() => setPendingDeleteZone(null)}
      />
    </main>
  );
}

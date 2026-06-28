"use client";

import { useState, useMemo } from "react";
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
  MonthlyPlanTab,
} from "../../components";
import { itemsPlannedForMonth, itemsUnassigned } from "@/features/home-improvements/domain";
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
    zones, items, itemsByZone, costByZone, pendingByZone,
    addZone, editZone, deleteZone, addItem, editItem, toggleDone, deleteItem,
    assignToMonth, unassignFromMonth,
  } = useHomeImprovements({ initialZones, initialItems, onSaveZones, onSaveItems });

  const [activeTab, setActiveTab] = useState<"zones" | "monthly">("zones");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const navigateMonth = (dir: 1 | -1) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + dir);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const plannedItems = useMemo(() => itemsPlannedForMonth(items, selectedMonth), [items, selectedMonth]);
  const unassignedItems = useMemo(() => itemsUnassigned(items), [items]);

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
          {totalCost > 0 && <span>· {formatCLP(totalCost)} estimado</span>}
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        {/* Tab toggle */}
        <div className="mb-8 flex gap-2 border-b border-cream-300">
          <button
            type="button"
            onClick={() => setActiveTab("zones")}
            className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "zones" ? "border-b-2 border-brown-800 text-brown-900" : "text-brown-400 hover:text-brown-700"}`}
          >
            Zonas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("monthly")}
            className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "monthly" ? "border-b-2 border-brown-800 text-brown-900" : "text-brown-400 hover:text-brown-700"}`}
          >
            Plan mensual
          </button>
        </div>

        {activeTab === "zones" ? (
          <>
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
          </>
        ) : (
          <MonthlyPlanTab
            zones={zones}
            plannedItems={plannedItems}
            unassignedItems={unassignedItems}
            selectedMonth={selectedMonth}
            isOwner={isOwner}
            onPrevMonth={() => navigateMonth(-1)}
            onNextMonth={() => navigateMonth(1)}
            onAssign={assignToMonth}
            onUnassign={unassignFromMonth}
            onToggle={toggleDone}
            onEdit={setEditingItem}
            onDelete={deleteItem}
          />
        )}
      </div>

      <AddZoneModal
        key={addZoneOpen ? 1 : 0}
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
        onAdd={(item) => { addItem(item); setAddItemZoneId(undefined); }}
      />
      <EditItemModal
        key={editingItem?.id}
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

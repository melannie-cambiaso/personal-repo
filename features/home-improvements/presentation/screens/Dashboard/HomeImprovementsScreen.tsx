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

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        {isOwner && (
          <div className="mb-8 flex justify-end">
            <AddButton onClick={() => setAddZoneOpen(true)} label="Agregar zona" />
          </div>
        )}

        <ZoneList
          zones={zones}
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

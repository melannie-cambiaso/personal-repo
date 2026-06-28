"use client";

import type { Zone } from "@/features/home-improvements/domain/Zone";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import { ImprovementItemCard } from "../ItemCard/ImprovementItemCard";
import { formatMonth } from "@/shared/utils/formatMonth";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  zones: Zone[];
  plannedItems: ImprovementItem[];
  unassignedItems: ImprovementItem[];
  selectedMonth: string;
  isOwner: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAssign: (itemId: string, month: string) => void;
  onUnassign: (itemId: string) => void;
  onToggle: (itemId: string) => void;
  onEdit: (item: ImprovementItem) => void;
  onDelete: (itemId: string) => void;
}

function groupByZone(items: ImprovementItem[]): Map<string, ImprovementItem[]> {
  return items.reduce((map, item) => {
    map.set(item.zoneId, [...(map.get(item.zoneId) ?? []), item]);
    return map;
  }, new Map<string, ImprovementItem[]>());
}

function ZoneGroupedItemList({
  title, items, byZone, zoneNameById, emptyText, isOwner, onToggle, onEdit, onDelete, renderAction,
}: {
  title: string;
  items: ImprovementItem[];
  byZone: Map<string, ImprovementItem[]>;
  zoneNameById: Map<string, string>;
  emptyText: string;
  isOwner: boolean;
  onToggle: (id: string) => void;
  onEdit: (item: ImprovementItem) => void;
  onDelete: (id: string) => void;
  renderAction: (item: ImprovementItem) => React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-brown-400">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-brown-400">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {[...byZone.entries()].map(([zoneId, zoneItems]) => (
            <div key={zoneId}>
              <p className="mb-2 text-xs font-semibold text-brown-500">{zoneNameById.get(zoneId) ?? zoneId}</p>
              <div className="flex flex-col gap-2">
                {zoneItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <ImprovementItemCard
                        item={item}
                        isOwner={isOwner}
                        onToggle={() => onToggle(item.id)}
                        onEdit={() => onEdit(item)}
                        onDelete={() => onDelete(item.id)}
                      />
                    </div>
                    {isOwner && renderAction(item)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function MonthlyPlanTab({
  zones, plannedItems, unassignedItems, selectedMonth, isOwner,
  onPrevMonth, onNextMonth, onAssign, onUnassign, onToggle, onEdit, onDelete,
}: Props) {
  const zoneNameById = new Map(zones.map((z) => [z.id, z.emoji ? `${z.emoji} ${z.name}` : z.name]));
  const plannedByZone = groupByZone(plannedItems);
  const unassignedByZone = groupByZone(unassignedItems);
  const label = formatMonth(selectedMonth);
  const totalCost = plannedItems.reduce((sum, i) => sum + (i.estimatedCost ?? 0) * (i.quantity ?? 1), 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onPrevMonth}
          className="cursor-pointer rounded-lg border border-cream-400 px-3 py-2 text-sm text-brown-600 transition-colors hover:bg-cream-300"
        >
          ← Anterior
        </button>
        <div className="text-center">
          <h2 className="font-dancing text-2xl font-bold capitalize text-brown-900">{label}</h2>
          {totalCost > 0 && (
            <p className="mt-0.5 text-sm font-semibold text-brown-600">{formatCLP(totalCost)} estimado</p>
          )}
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="cursor-pointer rounded-lg border border-cream-400 px-3 py-2 text-sm text-brown-600 transition-colors hover:bg-cream-300"
        >
          Siguiente →
        </button>
      </div>

      <ZoneGroupedItemList
        title={`Planificado para ${label}`}
        items={plannedItems}
        byZone={plannedByZone}
        zoneNameById={zoneNameById}
        emptyText="No hay items planificados para este mes."
        isOwner={isOwner}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        renderAction={(item) => (
          <button
            type="button"
            onClick={() => onUnassign(item.id)}
            className="shrink-0 cursor-pointer rounded-lg border border-cream-400 px-3 py-2 text-2xs font-bold text-brown-500 transition-colors hover:bg-cream-300"
          >
            Quitar
          </button>
        )}
      />

      <ZoneGroupedItemList
        title="Sin asignar"
        items={unassignedItems}
        byZone={unassignedByZone}
        zoneNameById={zoneNameById}
        emptyText="Todos los items pendientes tienen un mes asignado."
        isOwner={isOwner}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        renderAction={(item) => (
          <button
            type="button"
            onClick={() => onAssign(item.id, selectedMonth)}
            className="shrink-0 cursor-pointer rounded-lg bg-brown-800 px-3 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700"
          >
            Agregar
          </button>
        )}
      />
    </div>
  );
}

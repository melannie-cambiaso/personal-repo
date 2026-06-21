"use client";

import type { Zone } from "@/features/home-improvements/domain/Zone";
import type { ImprovementItem } from "@/features/home-improvements/domain/ImprovementItem";
import { ImprovementItemCard } from "../ItemCard/ImprovementItemCard";

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

function monthLabel(yyyyMm: string): string {
  return new Date(`${yyyyMm}-01T12:00:00`).toLocaleString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

export function MonthlyPlanTab({
  zones, plannedItems, unassignedItems, selectedMonth, isOwner,
  onPrevMonth, onNextMonth, onAssign, onUnassign, onToggle, onEdit, onDelete,
}: Props) {
  const zoneNameById = new Map(zones.map((z) => [z.id, z.emoji ? `${z.emoji} ${z.name}` : z.name]));
  const plannedByZone = groupByZone(plannedItems);
  const unassignedByZone = groupByZone(unassignedItems);
  const label = monthLabel(selectedMonth);

  return (
    <div className="flex flex-col gap-8">
      {/* Month navigator */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onPrevMonth}
          className="cursor-pointer rounded-lg border border-cream-400 px-3 py-2 text-sm text-brown-600 transition-colors hover:bg-cream-300"
        >
          ← Anterior
        </button>
        <h2 className="font-dancing text-2xl font-bold capitalize text-brown-900">{label}</h2>
        <button
          type="button"
          onClick={onNextMonth}
          className="cursor-pointer rounded-lg border border-cream-400 px-3 py-2 text-sm text-brown-600 transition-colors hover:bg-cream-300"
        >
          Siguiente →
        </button>
      </div>

      {/* Planned section */}
      <section>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-brown-400">
          Planificado para {label}
        </h3>
        {plannedItems.length === 0 ? (
          <p className="text-sm text-brown-400">No hay items planificados para este mes.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {[...plannedByZone.entries()].map(([zoneId, items]) => (
              <div key={zoneId}>
                <p className="mb-2 text-xs font-semibold text-brown-500">{zoneNameById.get(zoneId) ?? zoneId}</p>
                <div className="flex flex-col gap-2">
                  {items.map((item) => (
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
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => onUnassign(item.id)}
                          className="shrink-0 cursor-pointer rounded-lg border border-cream-400 px-3 py-2 text-2xs font-bold text-brown-500 transition-colors hover:bg-cream-300"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Unassigned section */}
      <section>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-brown-400">
          Sin asignar
        </h3>
        {unassignedItems.length === 0 ? (
          <p className="text-sm text-brown-400">Todos los items pendientes tienen un mes asignado.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {[...unassignedByZone.entries()].map(([zoneId, items]) => (
              <div key={zoneId}>
                <p className="mb-2 text-xs font-semibold text-brown-500">{zoneNameById.get(zoneId) ?? zoneId}</p>
                <div className="flex flex-col gap-2">
                  {items.map((item) => (
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
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => onAssign(item.id, selectedMonth)}
                          className="shrink-0 cursor-pointer rounded-lg bg-brown-800 px-3 py-2 text-2xs font-bold text-white transition-colors hover:bg-brown-700"
                        >
                          Agregar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

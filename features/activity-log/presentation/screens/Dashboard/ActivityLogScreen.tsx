"use client";

import type { ActivityLogEntry } from "@/features/activity-log/domain";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { AddButton } from "@/shared/components/AddButton/AddButton";
import { useActivityLog } from "../../hooks/useActivityLog";
import { ActivityLogMonthNav, ActivityLogList, AddActivityModal } from "../../components";

interface Props {
  initialEntries: ActivityLogEntry[];
}

export function ActivityLogScreen({ initialEntries }: Props) {
  const {
    entries,
    selectedMonth,
    setSelectedMonth,
    isModalOpen,
    setIsModalOpen,
    handleAdd,
    handleDelete,
  } = useActivityLog({ initialEntries });

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader eyebrow="Registro de actividades" title="Actividades" />

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <ActivityLogMonthNav month={selectedMonth} onChange={setSelectedMonth} />

        <div className="mt-8 flex justify-end">
          <AddButton onClick={() => setIsModalOpen(true)} label="Nueva actividad" />
        </div>
        <ActivityLogList entries={entries} onDelete={handleDelete} />
      </div>

      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAdd}
      />
    </main>
  );
}

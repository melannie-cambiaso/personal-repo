"use client";

import type { ActivityLogEntry } from "@/features/activity-log/domain";
import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { AddButton } from "@/shared/components/AddButton/AddButton";
import { MonthNav } from "@/shared/components/MonthNav/MonthNav";
import { formatMonth } from "@/shared/utils/formatMonth";
import { prevMonth, nextMonth } from "@/shared/utils/monthUtils";
import { useActivityLog } from "../../hooks/useActivityLog";
import { ActivityLogList, AddActivityModal } from "../../components";

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
        <MonthNav
          label={formatMonth(selectedMonth)}
          onPrev={() => setSelectedMonth(prevMonth(selectedMonth))}
          onNext={() => setSelectedMonth(nextMonth(selectedMonth))}
        />

        <div className="mt-8 flex justify-end">
          <AddButton onClick={() => setIsModalOpen(true)} label="Nueva actividad" />
        </div>
        <ActivityLogList entries={entries} onDelete={handleDelete} selectedMonth={selectedMonth} />
      </div>

      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAdd}
      />
    </main>
  );
}

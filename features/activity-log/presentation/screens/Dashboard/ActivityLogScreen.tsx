"use client";

import Link from "next/link";
import type { ActivityLogEntry } from "@/features/activity-log/domain";
import { useActivityLog } from "../../hooks/useActivityLog";
import {
  ActivityLogMonthNav,
  ActivityLogList,
  AddActivityModal,
} from "../../components";

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
      <div className="bg-brown-800 px-6 py-10 text-center text-white">
        <Link
          href="/"
          className="absolute left-4 top-4 flex items-center gap-1 text-sm text-cream-100/70 hover:text-cream-100"
        >
          ← Inicio
        </Link>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cream-100/60">
          Registro de actividades
        </p>
        <h1 className="font-dancing text-4xl font-bold">Actividades</h1>
      </div>

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <ActivityLogMonthNav month={selectedMonth} onChange={setSelectedMonth} />

        <ActivityLogList entries={entries} onDelete={handleDelete} />

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer rounded-2xl bg-brown-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brown-700 hover:shadow-card-hover"
          >
            + Nueva actividad
          </button>
        </div>
      </div>

      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAdd}
      />
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { ActivityLogEntry, Person } from "@/features/activity-log/domain";
import {
  addActivityEntry,
  deleteActivityEntry,
  getEntriesForMonth,
} from "@/features/activity-log/data";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

interface UseActivityLogParams {
  initialEntries: ActivityLogEntry[];
}

interface UseActivityLogReturn {
  entries: ActivityLogEntry[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  handleAdd: (data: {
    date: string;
    person: Person;
    activity: string;
    notes?: string;
  }) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
}

export function useActivityLog({ initialEntries }: UseActivityLogParams): UseActivityLogReturn {
  const [entries, setEntries] = useState<ActivityLogEntry[]>(initialEntries);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const selectedMonthRef = useRef(selectedMonth);
  useEffect(() => {
    selectedMonthRef.current = selectedMonth;
  }, [selectedMonth]);

  // Reload entries whenever the selected month changes
  useEffect(() => {
    let cancelled = false;
    getEntriesForMonth(selectedMonth).then((result) => {
      if (!cancelled) setEntries(result);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  async function handleAdd(data: {
    date: string;
    person: Person;
    activity: string;
    notes?: string;
  }): Promise<void> {
    // Optimistic update
    const optimistic: ActivityLogEntry = {
      id: crypto.randomUUID(),
      date: data.date,
      person: data.person,
      activity: data.activity,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [...prev, optimistic]);

    await addActivityEntry(data);

    // Refresh from server to get the canonical entry
    const refreshed = await getEntriesForMonth(selectedMonthRef.current);
    setEntries(refreshed);
  }

  async function handleDelete(id: string): Promise<void> {
    // Optimistic update
    setEntries((prev) => prev.filter((e) => e.id !== id));

    await deleteActivityEntry(id, selectedMonthRef.current);
  }

  return {
    entries,
    selectedMonth,
    setSelectedMonth,
    isModalOpen,
    setIsModalOpen,
    handleAdd,
    handleDelete,
  };
}

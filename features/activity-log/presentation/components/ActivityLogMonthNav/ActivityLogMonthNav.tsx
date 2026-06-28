"use client";

import { formatMonth } from "@/shared/utils/formatMonth";
import { MonthNav } from "@/shared/components/MonthNav/MonthNav";

interface Props {
  month: string;
  onChange: (month: string) => void;
}

function prevMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year!, m! - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
}

function nextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year!, m! - 1, 1);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 7);
}

export function ActivityLogMonthNav({ month, onChange }: Props) {
  return (
    <MonthNav
      label={formatMonth(month)}
      onPrev={() => onChange(prevMonth(month))}
      onNext={() => onChange(nextMonth(month))}
    />
  );
}

"use client";

import { formatMonth } from "@/shared/utils/formatMonth";
import { prevMonth, nextMonth } from "@/shared/utils/monthUtils";
import { MonthNav } from "@/shared/components/MonthNav/MonthNav";

interface Props {
  month: string;
  onChange: (month: string) => void;
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

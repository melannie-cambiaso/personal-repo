"use client";

import { formatMonth } from "@/shared/utils/formatMonth";
import { MonthNav } from "@/shared/components/MonthNav/MonthNav";

interface Props {
  selectedMonth: string;
  onPrev: () => void;
  onNext: () => void;
}

export function FinanceMonthNav({ selectedMonth, onPrev, onNext }: Props) {
  return <MonthNav label={formatMonth(selectedMonth)} onPrev={onPrev} onNext={onNext} />;
}

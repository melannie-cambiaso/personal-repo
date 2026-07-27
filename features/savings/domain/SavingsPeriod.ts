import type { SavingsEntry } from "./SavingsEntry";

export const INITIAL_PERIOD_ID = "period-initial";

export interface SavingsPeriod {
  id: string;
  label?: string;
  startedAt: string;
  closedAt?: string;
  initialAmount: number;
}

function bootstrapPeriod(): SavingsPeriod {
  return {
    id: INITIAL_PERIOD_ID,
    startedAt: new Date(0).toISOString(),
    initialAmount: 0,
  };
}

export function resolveEntryPeriodId(entry: SavingsEntry): string {
  return entry.periodId ?? INITIAL_PERIOD_ID;
}

export function resolveActivePeriod(periods: SavingsPeriod[]): SavingsPeriod {
  const active = periods.find((p) => !p.closedAt);
  return active ?? bootstrapPeriod();
}

export function selectPeriodEntries(entries: SavingsEntry[], periodId: string): SavingsEntry[] {
  return entries.filter((e) => resolveEntryPeriodId(e) === periodId);
}

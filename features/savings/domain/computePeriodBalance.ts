import { computeBalance } from "./computeBalance";
import type { SavingsEntry } from "./SavingsEntry";
import type { SavingsPeriod } from "./SavingsPeriod";

export function computePeriodBalance(entries: SavingsEntry[], period: SavingsPeriod): number {
  return period.initialAmount + computeBalance(entries);
}

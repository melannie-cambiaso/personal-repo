export type EntryType = "deposito" | "gasto";

export interface SavingsEntry {
  id: string;
  type: EntryType;
  amount: number;
  date: string;
  notes?: string;
  toReplenish: boolean;
  createdAt: string;
  goalId?: string;
}

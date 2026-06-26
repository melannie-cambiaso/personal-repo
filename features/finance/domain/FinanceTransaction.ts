export interface FinanceTransaction {
  id: string; // crypto.randomUUID()
  category: string;
  amount: number; // positive
  createdAt: string; // ISO 8601, always server "now"
}

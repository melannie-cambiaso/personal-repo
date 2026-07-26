import type { FinanceV2Transaction } from "@/features/finance-v2/domain";

// Single source of truth for transaction-type copy/order (mirrors `bucketLabels.ts`).
export const TRANSACTION_TYPE_LABELS: Record<FinanceV2Transaction["type"], string> = {
  income: "Ingreso",
  expense: "Gasto",
  savings: "Ahorro",
};

export const TRANSACTION_TYPE_ORDER: FinanceV2Transaction["type"][] = [
  "income",
  "expense",
  "savings",
];

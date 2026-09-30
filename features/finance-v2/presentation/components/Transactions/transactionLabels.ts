import type { FinanceV2Transaction } from "@/features/finance-v2/domain";

// Single source of truth for transaction-type copy/order (mirrors `bucketLabels.ts`).
export const TRANSACTION_TYPE_LABELS: Record<FinanceV2Transaction["type"], string> = {
  income: "Ingreso",
  expense: "Gasto",
  savings: "Ahorro",
  transfer: "Transferencia",
};

// `transfer` is deliberately absent: the form may only offer it once an envelope
// is configured, so that option is added conditionally at the call site.
export const TRANSACTION_TYPE_ORDER: FinanceV2Transaction["type"][] = [
  "income",
  "expense",
  "savings",
];

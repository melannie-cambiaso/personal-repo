"use server";

import { cookies } from "next/headers";
import { isAuthorized } from "@/shared/auth";
import type {
  BudgetConfig,
  EnvelopeConfig,
  FinanceV2Transaction,
} from "@/features/finance-v2/domain";
import { isTransactionMonth } from "@/features/finance-v2/domain";
import {
  saveBudgetVersion,
  saveTransactions,
  appendTransactionToMonth,
  loadTransactions,
  saveEnvelopeConfig,
  loadEnvelopeConfig,
  TransactionKvAdapter,
} from "./kvAdapter";
import { loadEnvelopeCarriedBalance } from "./envelopeCarriedBalance";
import { currentMonth } from "@/shared/utils/monthUtils";

// Saves the budget version effective from `month` (the viewed month being edited).
// `month` becomes part of the stored list's ordering, so it passes the same
// `isTransactionMonth` gate as every other month that reaches redis. A closed (past)
// month is rejected here too, not only hidden in the UI, so its budget stays frozen.
export async function handleSaveBudgetVersion(month: string, config: BudgetConfig): Promise<void> {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) return;
  if (!isTransactionMonth(month)) return;
  if (month < currentMonth()) return;
  await saveBudgetVersion(month, config);
}

// Whole-list-save action for the VIEWED month (deliberate deviation from granular add/
// delete actions): the hook computes the next list via the domain layer and sends the
// entire array, so there is no server-side read-modify-write. Used when
// `tx.month === viewedMonth`; a transaction filed to a DIFFERENT month goes through
// `handleAppendTransactionToMonth` below instead.
export async function handleSaveTransactions(
  month: string,
  transactions: FinanceV2Transaction[]
): Promise<void> {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) return;
  await saveTransactions(month, transactions);
}

// Single-param — deliberately NOT `(month, tx)`. A two-param signature would let a caller
// pass `month !== tx.month`, silently writing a record whose own field lies about its
// key. Deriving the target month from `tx.month` makes that divergence unrepresentable.
// `isTransactionMonth` is the ONE validation gate before user input reaches a redis key.
export async function handleAppendTransactionToMonth(tx: FinanceV2Transaction): Promise<void> {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) return;
  if (!isTransactionMonth(tx.month)) return;
  await appendTransactionToMonth(tx.month, tx);
}

// Unlike the RSC's direct `loadTransactions` call (already gated by the page-level
// redirect before it runs), this is invoked directly by the client hook on every month
// change and is therefore POST-reachable on its own — it must gate auth and validate
// `month` itself with `isTransactionMonth` (see `transactionDate.ts`).
export async function handleLoadTransactions(month: string): Promise<FinanceV2Transaction[]> {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) return [];
  if (!isTransactionMonth(month)) return [];
  return loadTransactions(month);
}

// Unlike the budget config, every field here feeds arithmetic or a comparison against
// month strings later, so a malformed config is dropped rather than persisted. The
// checks are runtime ones: the argument is whatever the POST sent, not the TS type.
export async function handleSaveEnvelopeConfig(config: EnvelopeConfig): Promise<void> {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) return;
  if (!isValidEnvelopeConfig(config)) return;
  await saveEnvelopeConfig(config);
}

function isValidEnvelopeConfig(config: EnvelopeConfig | null): boolean {
  if (typeof config !== "object" || config === null) return false;
  return (
    typeof config.name === "string" &&
    config.name.trim() !== "" &&
    typeof config.boundCategoryId === "string" &&
    config.boundCategoryId !== "" &&
    typeof config.openingBalance === "number" &&
    Number.isFinite(config.openingBalance) &&
    typeof config.openingMonth === "string" &&
    isTransactionMonth(config.openingMonth)
  );
}

// Called by the client hook on every month change, like `handleLoadTransactions`, so it
// gates auth and validates `month` itself. The math lives in `loadEnvelopeCarriedBalance`,
// shared with the RSC page's initial load.
export async function handleLoadEnvelopeCarriedBalance(month: string): Promise<number | null> {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore)) return null;
  if (!isTransactionMonth(month)) return null;
  return loadEnvelopeCarriedBalance(await loadEnvelopeConfig(), month, TransactionKvAdapter);
}

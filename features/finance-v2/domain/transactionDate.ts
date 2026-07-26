const TRANSACTION_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Validates a well-formed `YYYY-MM` string — the ONE place user input is
 *  checked before it is used to build a redis key (`kvAdapter.ts`'s
 *  `appendTransactionToMonth`). Rejects unpadded months (`2026-7`) and
 *  out-of-range months (`2026-13`). */
export function isTransactionMonth(value: string): boolean {
  return TRANSACTION_MONTH_PATTERN.test(value);
}

/** Local-time ISO date, unlike `new Date().toISOString().slice(0, 10)` (the
 *  savings `AddEntryModal` precedent) which reads UTC and can push a late-night
 *  entry into the next day/month. */
export function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Pure string slice, no Date parsing — the ONE place (besides `transactionsKey`
 *  in `data/kvAdapter.ts`) that derives a month string. Keep it that way. */
export const monthOf = (date: string): string => date.slice(0, 7);

/** Local-time ISO date, unlike `new Date().toISOString().slice(0, 10)` (the
 *  savings `AddEntryModal` precedent) which reads UTC and can push a late-night
 *  entry into the next day/month. */
export function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

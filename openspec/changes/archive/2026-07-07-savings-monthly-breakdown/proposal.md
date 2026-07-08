# Proposal: Monthly breakdown of savings deposits and expenses

## Intent

User ask (verbatim, Spanish): *"me gustaría poder ver agrupado por mes los depositos y gastos de
los ahorros para ver cómo he ido y qué puedo mejorar"* — I'd like to see savings deposits and
expenses grouped by month, to review how I've been doing and what I can improve.

**Problem today.** Savings has no month awareness anywhere. `SavingsSummaryCards` shows four
*all-time* totals (Ingresos / Gastos / Balance / A reponer) and the existing "Historial" tab is a
single flat reverse-chronological list of every entry with no month headers or per-month subtotals.
There is no way to answer "how did I do in June vs May?" or "which months did I overspend?" — the
user has to eyeball a long undifferentiated list and mentally add things up.

**Why now.** The user explicitly wants a review/retrospective surface to spot patterns ("qué puedo
mejorar"). The data to do this already exists client-side; only a derivation + a view are missing.

**What success looks like.** From the Savings screen the user can open a dedicated view that shows,
month by month, how much was deposited, how much was spent, and the net for that month — enough to
scan their trend over time and draw their own conclusions.

## Scope

### In Scope
- New pure domain function `groupEntriesByMonth(entries: SavingsEntry[]): MonthlySavingsGroup[]`
  under `features/savings/domain/`, mirroring the existing `groupTransactionsByDay.ts` Map-bucket +
  sort pattern. Each group carries `{ month: "YYYY-MM", totalDepositos, totalGastos, net, entries }`.
  Co-located vitest `.test.ts` (Strict TDD is active).
- Month key derived by a trivial `entry.date.slice(0, 7)` — `date` is already a `"YYYY-MM-DD"`
  string, so **no `Date` parsing and no timezone handling** are needed.
- New tab/section in `SavingsScreen.tsx` that renders one card/row per month with the three totals
  (Depositado, Gastado, Neto), reusing `formatCLP` and the existing visual language of
  `SavingsSummaryCards` / `SavingsEntryCard`.
- Reuse of `shared/utils/formatMonth.ts` for human month labels (e.g. "Junio 2026").
- Presentation-only additions (new component folder, e.g.
  `features/savings/presentation/components/MonthlyBreakdown/`) wired into `SavingsScreen`.

### Out of Scope
- No changes to `features/finance/` (confirmed separate, non-overlapping domain).
- No changes to `features/savings/data/` (kvAdapter / savingsActions) or the Redis storage shape —
  all entries are already loaded client-side in full; grouping is a pure in-memory derivation.
- No changes to `SavingsEntry.ts` (the `date` field is already sufficient).
- No changes to the existing flat "Historial" list, the "Metas" tab, or the all-time
  `SavingsSummaryCards`.

## Approach

**1. Domain — one pure function.** Add `groupEntriesByMonth.ts` next to the existing savings domain
functions, structurally mirroring `features/finance/domain/groupTransactionsByDay.ts`:

```ts
// features/savings/domain/groupEntriesByMonth.ts
export interface MonthlySavingsGroup {
  month: string;          // "YYYY-MM" — sort/identity key
  totalDepositos: number; // sum of "deposito" amounts in the month
  totalGastos: number;    // sum of "gasto" amounts in the month
  net: number;            // totalDepositos - totalGastos
  entries: SavingsEntry[];
}

export function groupEntriesByMonth(entries: SavingsEntry[]): MonthlySavingsGroup[] { /* ... */ }
```

Bucket entries into a `Map<"YYYY-MM", SavingsEntry[]>` by `entry.date.slice(0, 7)`, compute the two
totals + net per bucket, and return groups sorted by month **descending** (newest first — consistent
with the existing reverse-chronological "Historial"). This is directly unit-testable and keeps all
month math in the domain layer, matching the project's hexagonal convention.

**2. Presentation — a dedicated month view.** Add a new tab (third tab alongside "Historial" and
"Metas") whose body maps `groupEntriesByMonth(entries)` to a list of month cards, each showing
Depositado / Gastado / Neto via `formatCLP` and a `formatMonth` header. Numbers only — same pattern
finance already uses (plain totals, no chart).

**Why a full month list rather than single-month `MonthNav` navigation.** The intent is to *see how
I've been doing over time* ("ver cómo he ido"), which is a trend/retrospective across months. A
scrollable list of all months answers that directly; a `MonthNav` prev/next selector shows one month
at a time and hides the trend. We therefore reuse `formatMonth` for labels but **not** the
single-month `MonthNav` selector. (This is flagged for confirmation in the question round below.)

## Non-Goals

- **No charting library.** `package.json` ships only next / react / @upstash/redis / exceljs; nothing
  requires a chart lib and the app has stayed dependency-minimal. Confirmed with the user: plain
  numbers, not a CSS bar chart and not a chart dependency.
- **No automatic insights or comparisons** — no "you spent more than average", no month-over-month
  deltas, no highlighting. Just show the per-month breakdown; the user draws their own conclusions.
- **No new server actions, storage keys, pagination, or virtualization** — realistic personal-volume
  data (dozens to low hundreds of entries/year) groups cheaply in memory.
- **No touching finance.** This change lives entirely inside `features/savings/` plus read-only reuse
  of the generic `shared/utils/formatMonth.ts`.

## Proposal question round — resolved

Both framing items were confirmed by the user:

1. **Tab label.** Third tab, distinct from the existing "Historial" list, labeled **"Por mes"**.
2. **View format.** All months in one scrollable list, newest first — not a single-month `MonthNav`
   selector.

No re-scoping needed; spec/design proceed as written above.

## Success Criteria

- [ ] `groupEntriesByMonth` returns one group per calendar month with correct `totalDepositos`,
      `totalGastos`, and `net`, sorted newest-first, and has passing co-located unit tests.
- [ ] A dedicated savings view lists each month with its Depositado / Gastado / Neto totals using
      `formatCLP` and a `formatMonth` header.
- [ ] The existing "Historial" flat list, "Metas" tab, and all-time `SavingsSummaryCards` are
      unchanged.
- [ ] No new runtime dependency added; `features/finance/` and `features/savings/data/` untouched.
- [ ] Full suite green (`npm run test`).

## Rollback Plan

Delete `groupEntriesByMonth.ts` (+ its test) and the new `MonthlyBreakdown/` component, and remove
the third-tab wiring from `SavingsScreen.tsx`. No data or schema migration is involved — the feature
is purely additive and derivation-only.

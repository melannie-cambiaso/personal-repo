# Tasks: Monthly breakdown of savings deposits and expenses

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200 total (single PR) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | None — one PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | n/a (no chaining) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Carrying forward design.md's forecast: ~200 estimated changed lines across 2 new domain files
(~88), 2 new presentation files (~100), 3 barrel/screen edits (~15). Purely additive,
`features/finance/` and `features/savings/data/` untouched, no schema/migration surface. **The
size guard does not trip — single PR, no user decision needed before apply.**

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain: `groupEntriesByMonth` + barrel export | PR 1 (only) | Base `main`; tests included |
| 2 | Presentation: `MonthlyBreakdown` + `SavingsScreen` wiring | PR 1 (only) | Same PR as unit 1; depends on unit 1 |

## Phase 1: Domain — `groupEntriesByMonth`

- [x] 1.1 RED: create `features/savings/domain/groupEntriesByMonth.test.ts` (style mirrors
  `computeBalance.test.ts`: `entry(overrides)` fixture factory, relative import
  `./groupEntriesByMonth`, `describe("groupEntriesByMonth", () => {...})`). Cases:
  - Empty array → `[]`.
  - Same-month entries (`"2026-06-03"`, `"2026-06-17"`) bucket together; different-month entry
    (`"2026-07-01"`) is a separate group.
  - Mixed `deposito`/`gasto` in one month → `totalDepositos`, `totalGastos`, `net` computed
    correctly (150000/30000/120000 fixture from spec).
  - `gasto`-only month → `totalDepositos: 0`, negative `net`, `entries` preserved.
  - Multiple months (`"2026-05"`, `"2026-06"`, `"2026-07"`) → sorted newest-first by `month`.
  - Month key derived from `date` (not any other field) — entry with `date: "2026-05-31"` buckets
    under `"2026-05"` regardless of other fields.
  Suite must fail to compile/run — the function does not exist yet.
  *(savings-monthly-breakdown: groups entries by month, computes totals/net, sorts newest-first)*

- [x] 1.2 GREEN: implement `features/savings/domain/groupEntriesByMonth.ts` — `MonthlySavingsGroup`
  interface (`month`, `totalDepositos`, `totalGastos`, `net`, `entries`) and named export
  `groupEntriesByMonth(entries: SavingsEntry[]): MonthlySavingsGroup[]`, Map-bucket keyed on
  `entry.date.slice(0, 7)` → per-bucket reduce → `sort((a, b) => b.month.localeCompare(a.month))`,
  mirroring `features/finance/domain/groupTransactionsByDay.ts`'s skeleton. Test suite (1.1) passes.

- [x] 1.3 GREEN: add `export { groupEntriesByMonth }` and
  `export type { MonthlySavingsGroup }` to `features/savings/domain/index.ts`, matching the
  existing sibling export style (`computeBalance`, `SavingsGoal`, etc.).

## Phase 2: Presentation — `MonthlyBreakdown` component + tab wiring

- [x] 2.1 RED: create
  `features/savings/presentation/components/MonthlyBreakdown/MonthlyBreakdown.test.tsx` (RTL).
  Cases:
  - Renders one card per month, newest first, for a 2-month fixture.
  - Each card shows Depositado/Gastado/Neto formatted via `formatCLP` and a header formatted via
    `formatMonth`.
  - Empty `entries={[]}` → renders "Sin registros" placeholder, no crash.
  Must fail — component does not exist yet.
  *(savings-monthly-breakdown: "Por mes" tab renders correct totals newest-first; empty state has
  no error)*

- [x] 2.2 GREEN: implement
  `features/savings/presentation/components/MonthlyBreakdown/MonthlyBreakdown.tsx` — presentational,
  no local state, calls `groupEntriesByMonth(entries)` internally, maps to one card per month
  (`formatMonth` header; Depositado/Gastado/Neto via `formatCLP`), renders "Sin registros" when
  `groups.length === 0`. Test suite (2.1) passes.

- [x] 2.3 GREEN: add
  `export { MonthlyBreakdown } from "./MonthlyBreakdown/MonthlyBreakdown"` to
  `features/savings/presentation/components/index.ts`.

- [x] 2.4 GREEN: wire the tab in
  `features/savings/presentation/screens/Dashboard/SavingsScreen.tsx`:
  - Widen `useState<"history" | "goals">("history")` (line ~56) to
    `useState<"history" | "goals" | "monthly">("history")`.
  - Add `MonthlyBreakdown` to the `../../components` barrel import (lines ~9–19).
  - After the "Metas" tab button (line ~93), add a third `<button onClick={() =>
    setActiveTab("monthly")}>` labeled "Por mes", same className pattern keyed on
    `activeTab === "monthly"`.
  - After the `activeTab === "goals"` panel (line ~142), add
    `{activeTab === "monthly" && <MonthlyBreakdown entries={entries} />}`.
  Do not touch the existing "Historial"/"Metas" button or panel JSX.

## Phase 3: Regression check

- [x] 3.1 Run `npm run test` — full suite green, confirming no regression in:
  - `SavingsEntryList`/"Historial" tab tests — unaffected, JSX untouched.
  - "Metas" tab tests — unaffected, JSX untouched.
  - `SavingsSummaryCards` tests — unaffected, component untouched.
  - New `groupEntriesByMonth.test.ts` and `MonthlyBreakdown.test.tsx` — passing.
  *(savings-monthly-breakdown: "Historial", "Metas", and all-time summary cards are unaffected)*

- [x] 3.2 Run `tsc --noEmit` — clean, confirming the widened `activeTab` union and new
  `MonthlyBreakdown` props type-check across `SavingsScreen.tsx` and the new component/domain
  files.

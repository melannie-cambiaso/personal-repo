# Feature: finance-v2 month analysis

Locator: `odd/tasks/finance-v2-month-analysis.md` · Engram mirror: `odd/finance-v2-month-analysis/tasks`
Branch: `feat/finance-v2-month-analysis`

## Objective
Analyze a month's spending in finance-v2 and help decide how to improve the next month, accounting for weekly recurring expenses whose monthly amount depends on the number of weeks in the month.

## Problem / Why
Budget categories hold a flat monthly amount. Weekly expenses (food, cleaning, etc.) cost more in 5-week months than 4-week months, so the budget is wrong half the time and there is no analysis or month-over-month guidance.

## Decisions (user-confirmed 2026-09-26)
- Scope: finance-v2 only (`features/finance-v2`, `app/finance-v2`).
- Weekly is defined per budget category leaf: `frequency: "monthly" | "weekly"` (default `monthly`). Weekly `amount` is per week; monthly budget = `amount × getWeeksInMonth(month)`.
- Weeks in month = number of Mondays (`shared/utils/monthUtils.ts#getWeeksInMonth`, pre-existing uncommitted user work).
- New read-only **Analysis** tab for the viewed month with three blocks:
  1. Month summary: weeks, week-adjusted budget, actual spent, difference.
  2. Per-category deviation: budgeted vs spent sorted from biggest overrun to biggest saving; weekly categories also show per-week budget vs per-week actual average.
  3. Next month: weeks count, projected budget, and for overrun categories the projected spend at the current pace (to know how much to cut).
- Analysis does not edit the budget (v1 of the feature).
- (2026-09-26) Weekly leaves recur on a specific weekday (e.g. cleaning every Sunday). A weekly leaf carries optional `weekday` (0 = Sunday … 6 = Saturday, JS `Date#getDay`); its weeks in a month = occurrences of that weekday. Absent `weekday` means Monday, preserving the original Mondays-based behavior.
- (2026-09-26) Month analysis summary drops its single month-wide `weeks` figure (meaningless once weekly leaves differ by weekday); weeks are reported per weekly leaf in the deviations block instead. Same for the next-month block's single `weeks`.

## Constraints
- Budget config stays global (not month-keyed); month-dependence is computed.
- Existing budgets without `frequency` must keep working as monthly (backward compatible persistence).
- Hexagonal layout: pure domain functions in `domain/`, UI in `presentation/`.
- UI copy follows the existing finance-v2 UI language.

## TDD
Mode: on · Source: user global CLAUDE.md ("Strict TDD Mode: enabled") · Runner: `vitest run` (`npm test`)

## Delivery
Strategy: single branch with chained work-unit commits, no PR split (user-confirmed 2026-09-26: personal project, no reviewer load to protect).

## Tasks
- [x] T1 — Domain: `frequency` on budget leaf + `getWeeksInMonth` tests + month-aware budget amounts (`resolveLeafMonthlyAmount`) used by budget/spend rollups. Route: delegated (writer trigger, 2+ non-trivial files).
- [x] T2 — Domain: `computeMonthAnalysis(config, transactions, month)` → summary, per-category deviation, next-month projection. Route: delegated.
- [x] T3 — Budget UI: set category frequency (monthly/weekly) and show per-week amount + month total for viewed month. Route: delegated.
- [x] T3b — Weekday per weekly leaf: domain (`weekday` field, weekday-aware week count, `resolveLeafMonthlyAmount`, `setLeafWeekday`), month analysis weeks per leaf, hook action, and Lun…Dom selector shown only for weekly leaves.
- [x] T4 — Analysis tab UI wired into `FinanceV2Screen`. Route: direct, one file per user message (worker unavailable).

## Acceptance criteria
- Weekly category with $20.000/week budgets $100.000 in a 5-Monday month and $80.000 in a 4-Monday month.
- A Sunday weekly category budgets 5 weeks in May 2026 (5 Sundays, 4 Mondays).
- Legacy configs without `frequency` behave exactly as before.
- Analysis tab shows the three blocks for the viewed month; overrun categories show next-month pace projection.
- `npm test` green; `tsc` / lint clean.

## Checks
`npm test`, `npx tsc --noEmit`, `npm run lint`

## Progress / Evidence
- T1 done — commit `47be5b7` feat(finance-v2): support weekly budget categories scaled by weeks in month.
- T2 RED — commit `9873d72` test(finance-v2): specify computeMonthAnalysis before implementing it (fails on missing `./monthAnalysis`).
- 2026-09-26: uncommitted T2 implementation lost when the session window closed; resumed from the committed RED spec.
- T2 GREEN — commit `09261dc` feat(finance-v2): add computeMonthAnalysis for month review and next-month projection. Verified: finance-v2 vitest 266/266 passing, `tsc --noEmit` clean.

- T3 step 1/3 — commit `abfc39d` fix(finance-v2): resolve category view amounts for the viewed month. Found while planning T3: `toCategoryView` summed raw subcategory amounts, so parent totals showed per-week figures for weekly subs (edit + view mode). Verified: finance-v2 vitest 268/268, `tsc` clean.
- 2026-09-26: ODD runtime gate allows one direct file edit per user turn; `gentle-ai-worker` failed twice with provider errors, so T3 proceeds one file per turn with the user watching.
- T3 step 2/3 — commit `4113556` feat(finance-v2): expose handleFrequencyChange from the budget hook. Verified: finance-v2 vitest 270/270, `tsc` clean, eslint clean on touched files.
- T3 step 3/3 — commit `583811e` feat(finance-v2): let budget leaves switch between monthly and weekly. Verified: finance-v2 vitest 275/275, `tsc` clean, eslint clean on touched dirs; user hit the runtime error before the screen wiring landed, resolved by the final step.
- 2026-09-26: user pointed out weekly expenses fall on a specific weekday (cleaning on Sundays) → T3b added.
- T3b domain done: `f4c5ef8` countWeekdayInMonth, `6ff383f` weekday-scaled weekly leaves, `9853453` setLeafWeekday, `4a9a0a5` per-leaf weekday/weeks on category views, `4d08369` weekday-aware month analysis (summary/nextMonth `weeks` dropped).
- T3b hook — commit `a3f41c8` feat(finance-v2): expose handleWeekdayChange from the budget hook. Verified: finance-v2 vitest 287/287, `tsc` clean, eslint clean on touched files.
- T3b UI — commit `bfae7fe` feat(finance-v2): pick the recurring weekday of a weekly budget leaf. Lun…Dom `Select` (`aria-label` `Día de <leaf>`) rendered in edit mode only, for weekly leaves only, on both the leaf header and weekly subcategory rows; threaded through `BudgetTab` and `FinanceV2Screen`. Verified: finance-v2 vitest 292/292, `tsc --noEmit` clean, eslint clean on `presentation/components/Budget` + `presentation/screens/Dashboard`.
- 2026-09-27: T3b RED caught a live display bug — `BudgetCategoryCard` fed one month-wide `getWeeksInMonth(month)` to every `WeeklyHint`, so a Tuesday weekly leaf rendered "por semana · × 4 semanas = $100.000" (4 Mondays, but the amount resolved off 5 Tuesdays). Fixed in the same commit by reading each leaf's own `view.weeks` / `sub.weeks`; `getWeeksInMonth` is no longer imported there.
- 2026-09-27: `gentle-ai-worker` failed twice again with provider errors (0 tool calls), so T3b UI proceeded one file per user message under the ODD one-direct-edit-per-turn gate. Mechanical prop propagation across the 28 `BudgetCategoryCard` and 11 `BudgetTab` test renders was done with `perl -i -pe`, disclosed to the user.

- T4 barrel — `computeMonthAnalysis` and its types were never exported from `domain/index.ts`, so `presentation` could not reach the T2 domain work at all; exported in `05ff2d2`.
- T4 component — commit `05ff2d2` feat(finance-v2): add the month Analysis tab component. Read-only `AnalysisTab` rendering the three blocks; `analysis: MonthAnalysis | null` withholds everything while the month loads (a not-yet-loaded month analyzes as zero spend, i.e. every category under budget). Deviations render in the domain's worst-first order, never re-sorted locally; signed deviations (`+$15.000` / `-$8.000`) because `formatCLP(-8000)` yields `$-8.000`; tone reuses the domain's `isOverrun`. Verified: finance-v2 vitest 306/306, `tsc` clean, eslint clean.
- T4 wiring — commit `57acc4f` feat(finance-v2): wire the Analysis tab into FinanceV2Screen. Third tab "Análisis"; `computeMonthAnalysis` memoized on the same axes as `spendComparison` so the two tabs cannot disagree, with `isLoadingMonth` applied at the prop (mirrors `toSpendView`). Verified: finance-v2 vitest 309/309, `tsc` clean, eslint clean.
- 2026-09-27: two of my own test assertions were wrong before the code was, and the runs caught both — a bare `queryByText(/semanas/)` matched the deviations block instead of the next-month block, and the month-projection test was synchronous when changing months legitimately enters the loading state. Also fixed a real hole the tests exposed: `NextMonthOverrun.projectedOverrun` is signed and can be non-positive, so the tab said "recortar $-4.000"; it now reads "sin recorte necesario".

### Readability fixes the user found by using the screen (2026-09-27, after T4)
Three separate places computed the right number and left the last step to the reader. No domain arithmetic was wrong in any of them, and no domain test could have caught them.
- `911dfa0` — the Analysis summary's bare "sin categoría: $12.000" gave no way to tell whether that spend was already inside `Gastado` (it is, and is therefore already netted into `difference`). Now "incluye sin categoría: ...".
- `6b07288` — same wording, same ambiguity, in `BucketComparison`'s bucket rows and total on the Budget tab. Aligned.
- `0b1d6f2` — `SpendPairing` rendered "$450.000 de $400.000 · excedido" without the excess, i.e. the one figure that says how much to cut. Now "excedido en $50.000". One shared component, so it fixed bucket rows, the total, leaves, subcategories and parent-derived totals at once.
- `9e00a74` — hardening. Three assertions (`/sin categoría/`, `/excedido/`, unanchored `/de \$5\.000 · excedido/`) passed both before and after these copy changes, so they guarded nothing. Pinned to exact text; the within-budget assertion now also proves that row carries no suffix at all.

User verified all of the above in the browser on `/finance-v2` and reported no further issues.

## Known debt (out of scope)
- `npx eslint features/finance-v2` fails on pre-existing `react-hooks/refs` in `presentation/hooks/useFinanceV2Transactions.ts:63` (from `049311c`, 2026-07-27): `loadedMonthRef.current` read during render. Not introduced by this feature.

## Next step
None. The feature is complete: every task implemented, committed, and confirmed in the browser by the user on 2026-09-27. Closing state: finance-v2 vitest 310/310, `tsc --noEmit` clean, eslint clean on every touched directory.

Known, deliberate limits if this is ever picked up again:
- Análisis is read-only (v1 decision): it shows what to cut but offers no affordance to change the budget from there.
- `presentation/components/index.ts` exports every other component but not `AnalysisTab`. `FinanceV2Screen` imports it by direct path, as it does `BudgetTab`, so nothing is broken — the barrel is just incomplete.
- The user expects to revisit this once it sees real monthly use; no outstanding request as of close.

# Feature: finance-v2 budget versioning

Locator: `odd/tasks/finance-v2-budget-versioning.md` · Engram mirror: `odd/finance-v2-budget-versioning/tasks`
Branch: `feat/finance-v2-budget-versioning`

## Objective
Version the budget over time: a change (new subcategory, amount, frequency, delete) applies from
the edited month onward, and earlier months keep the budget they had.

## Problem / Why
The budget is one global tree (`finance-v2-budget-config`) with no month dimension. Any edit
recomputes every past month: spend on a leaf that became a parent or was deleted falls into
`unassigned`, and amount edits rewrite past budget-vs-spent.

## Decisions (user-confirmed 2026-10-06)
- A change takes effect from the month being edited (usually the current month, even if it already
  has movements); earlier months are frozen.
- (agent design) Effective-dated versions `BudgetVersion { effectiveFrom, config, updatedAt }`
  stored under `finance-v2-budget-versions`, sorted by `effectiveFrom`. Month M resolves to the
  latest version with `effectiveFrom <= M`, else `DEFAULT_BUDGET_CONFIG`.
- (agent design) Editing month M upserts version M only; earlier and later versions are untouched.
- (agent design) Past months (before `currentMonth()`) are read-only in the Budget tab.
- (agent design) Legacy seed on read: a missing versions key becomes
  `[{ effectiveFrom: "0000-00", config: <legacy config or default> }]`; the legacy key is kept.

## Constraints
- Hexagonal layout: pure domain functions in `domain/`, UI in `presentation/`.
- UI copy in Spanish, matching existing finance-v2 copy.
- Leaf ids stay stable across versions (transactions match by id).

## TDD
Mode: on · Runner: `vitest run` (`npm run test`)

## Delivery
Single branch with chained work-unit commits, fast-forward to `main` when the user approves (no PR).

## Tasks
- [x] T1 — Domain: `budgetVersions.ts` (`BudgetVersion`, `resolveBudgetForMonth`, `upsertBudgetVersion`) + tests. Route: inline (one new pure module + test). RED (module missing) → GREEN 10/10.
- [x] T2 — Data: `loadBudgetVersions` (legacy seed), `saveBudgetVersion`, `handleSaveBudgetVersion` action, home summary resolves current month. Route: delegated writer (multi-file). RED (kvAdapter/actions/home summary tests: 19 failing, functions missing) → GREEN data 73/73. `loadBudgetConfig`, `saveBudgetConfig` and `handleSaveBudgetConfig` removed (no callers left); the legacy key is only read by the seed.
- [x] T3 — Presentation: page loads versions; `FinanceV2Screen` resolves budget per viewed month; `useFinanceV2Budget` re-syncs on month and saves per month; past months read-only. Route: delegated writer (multi-file). RED (hook, BudgetTab and screen tests failing on the new API) → GREEN `vitest run features/finance-v2` 515/515.
- [x] T4 — Verify: full `npm run test` 838/838 (writer), `npx tsc --noEmit` clean (parent re-ran), `npm run build` green (parent). T2+T3 commit `cf4894b`. RDD assess on f2970d0..cf4894b: medium, `slice_budget_reached` (869 lines) → consent requested for lineage `review-e437accca0a07250`.

## Acceptance criteria
- Editing in the current month does not change any earlier month's budget or spend pairing.
- The next month inherits the change; a reload preserves it.
- Past months show the budget read-only.
- Existing data keeps rendering the same history after the first load.

## Progress
- T1 commit `0ebec38`. RDD assess: medium, `under_budget` (174 lines), pending in slice.
- T2+T3 (one delegated writer, uncommitted at hand-off; ~539+/142- lines including tests):
  - Hook design: `useFinanceV2Budget({ initialVersions, month, onSave(month, config) })` owns
    the versions list (still hoisted in the screen) and derives the viewed month's config with
    `resolveBudgetForMonth`, so it follows month changes with no effect or re-key. Edits clone the
    resolved config through the pure mutations and `upsertBudgetVersion` the viewed month;
    `versionsRef` keeps the stale-closure protection.
  - Read-only boundary: `viewedMonth < initialMonth` (the page's server `currentMonth()`), not
    the client clock, so SSR and hydration agree. `BudgetTab` gets `readOnly`: hides the toggle
    and shows "Presupuesto de un mes cerrado: solo lectura"; the screen forces `mode="view"`.
  - Seed safety: `saveBudgetVersion` reads through a throwing helper, so a failed read writes
    nothing instead of overwriting every version with one.
  - Checks: `npx vitest run features/finance-v2` 515 passed; `npx tsc --noEmit` clean;
    `npm run test` 84 files / 838 tests passed; `npx eslint features/finance-v2 app/finance-v2` clean.
- T2+T3 commit `cf4894b`; T4 verified (tests 838/838, tsc clean, build green).
- RDD: consent granted; lens `review-reliability` approved; lineage `review-e437accca0a07250`
  acknowledged (authority burned). Reviewed boundary advances to `cf4894b`.
- Advisory follow-ups (non-blocking, not done):
  - R3-server-readonly-unenforced: FIXED (T5, user-requested 2026-10-06) — `handleSaveBudgetVersion`
    rejects `month < currentMonth()`. RED (past-month test) → GREEN; finance-v2 517/517, tsc clean.
  - R3-lost-update-rmw: `saveBudgetVersion` read-modify-write is not atomic across tabs/devices.
  - R3-unvalidated-stored-shape: stored versions value is not shape-checked.
  - R3-stale-closed-boundary: a session open across a month rollover keeps the ended month editable until reload.
- Next: user decides on follow-ups and on fast-forwarding to `main`.

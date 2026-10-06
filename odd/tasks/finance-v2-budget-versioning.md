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
- [ ] T2 — Data: `loadBudgetVersions` (legacy seed), `saveBudgetVersion`, `handleSaveBudgetVersion` action, home summary resolves current month. Route: delegated writer (multi-file).
- [ ] T3 — Presentation: page loads versions; `FinanceV2Screen` resolves budget per viewed month; `useFinanceV2Budget` re-syncs on month and saves per month; past months read-only. Route: delegated writer (multi-file).
- [ ] T4 — Verify: full `npm run test`, `npx tsc --noEmit`, `npm run build`.

## Acceptance criteria
- Editing in the current month does not change any earlier month's budget or spend pairing.
- The next month inherits the change; a reload preserves it.
- Past months show the budget read-only.
- Existing data keeps rendering the same history after the first load.

## Progress
Branch created. Next: T1.

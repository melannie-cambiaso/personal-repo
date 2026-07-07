# Tasks: Extract `computeBudgetSummary()` for the Neto card figures

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~80 total (single PR) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | None — one PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | n/a (no chaining) |

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: Low

This is a small single-PR change (~80 estimated changed lines: ~18 new domain function, ~50 new
domain test, ~2 barrel export lines, ~8 `BudgetTab.tsx` edit, ~4 `BudgetTab.test.tsx` B3 rewrite).
`delivery_strategy` is `ask-on-risk`, but the estimate is well under the 400-line budget threshold,
touches only two production files (one new, one modified) plus their tests, and carries no
schema/data-migration surface. **The size guard does not trip — no user decision needed, proceed as
a single PR.**

## Phase 1: Domain function `computeBudgetSummary()`

- [x] 1.1 RED: create `features/finance/domain/computeBudgetSummary.test.ts` (style mirrors
  `computePendingExpenses.test.ts`: `import { describe, it, expect } from "vitest"`, relative
  import `./computeBudgetSummary`, `describe("computeBudgetSummary", () => {...})`). Cases:
  - **B3 fixture**: `{ actualIncome: 1000000, actualExpense: 0, actualRefund: 100000,
    budgetRefund: 0, pendingExpenses: 400000 }` → `actualNet: 1000000`, `realBalance: 1100000`,
    `available: 700000`, `potentialSavings: -100000`.
  - **No-refund parity** (regression parity with B1): `actualRefund: 0`, `budgetRefund: 0` →
    `realBalance === actualNet`, `available === actualNet − pendingExpenses`,
    `potentialSavings: 0`.
  - **Negative `available`** (Faltante, B2 parity): `pendingExpenses` exceeds `realBalance` →
    `available` is negative.
  - **Positive `potentialSavings`**: `budgetRefund > actualRefund` → positive gap (refund still
    expected).
  - **`actualNet` excludes refunds guard**: assert `actualNet` ignores `actualRefund` entirely
    (varying `actualRefund` does not change `actualNet`).

  The suite must fail to compile/run at this point — the function does not exist yet.
  *(finance-budget-summary: available reflects real refunds already received (B3 fixture);
  potentialSavings reflects the still-expected gap (B3 fixture); actualNet remains unaffected by
  refunds)*

- [x] 1.2 GREEN: implement `features/finance/domain/computeBudgetSummary.ts` — `BudgetSummary`
  interface (`actualNet`, `realBalance`, `potentialSavings`, `available`, `pendingExpenses`) and
  named export `computeBudgetSummary(input: { actualIncome; actualExpense; actualRefund;
  budgetRefund; pendingExpenses })` per design.md's object-parameter signature. Plain named
  export, explicit return type, no default export. Domain test suite (1.1) passes.
  *(finance-budget-summary: available is computed from realBalance minus pendingExpenses;
  potentialSavings is the still-expected refund gap; actualNet remains unaffected by refunds)*

- [x] 1.3 GREEN: add `export { computeBudgetSummary }` and `export type { BudgetSummary }` to
  `features/finance/domain/index.ts`, matching how sibling domain functions
  (`computeActualFromTransactions`, `computePendingExpenses`) are re-exported.

## Phase 2: `BudgetTab.tsx` integration

- [x] 2.1 RED: rewrite test **B3** in `BudgetTab.test.tsx` (`:292`). Fixture unchanged
  (`initialBudget={{ Arriendo: 400000 }}`, transactions `[Peter +1000000 income, Isapre +100000
  refund]`). Replace the single old assertion (`within(netoCard).getByText("Ahorro potencial
  $700.000")`) with two new ones:
  ```ts
  expect(within(netoCard).getByText("Disponible $700.000")).toBeTruthy();
  expect(within(netoCard).getByText("Ahorro potencial $100.000")).toBeTruthy();
  ```
  Update the `// B3 —` comment to describe the corrected split. Against the still-inline old math
  this must now fail (old code renders `Disponible $600.000` + `Ahorro potencial $600.000`).
  *(finance-budget-summary: B3 is rewritten to assert the corrected values)*

- [x] 2.2 GREEN: in `features/finance/presentation/components/Budget/BudgetTab.tsx`, add
  `computeBudgetSummary` to the existing `@/features/finance/domain` import (line 6). Replace
  inline lines 87–89 (`actualNet` / `available` / `ahorroPotencial` hand computation) with:
  ```ts
  const { actualNet, available, potentialSavings } = computeBudgetSummary({
    actualIncome,
    actualExpense,
    actualRefund,
    budgetRefund,
    pendingExpenses,
  });
  ```
  Change the "Neto" `SummaryCard` (line 134) prop value only:
  `ahorroPotencial={ahorroPotencial}` → `ahorroPotencial={potentialSavings}` — keep the prop
  *name* `ahorroPotencial` on `SummaryCard` unchanged (Non-Goal: no relabeling; A4/A5 assert
  against this prop name). `disponible={available}` is unchanged in name, now carrying the
  redefined `available`. B3 (2.1) passes.
  *(finance-budget-summary: available reflects real refunds already received (B3 fixture);
  potentialSavings reflects the still-expected gap (B3 fixture))*

## Phase 3: Full suite regression check

- [x] 3.1 Run `npm run test` — confirm full suite green with no regression:
  - **T4** (`:138`, "Neto excludes refunds → $400.000") — unaffected; `actualNet` formula
    unchanged.
  - **B1** (`:260`, "Disponible $600.000") and **B2** (`:276`, "Faltante $400.000") — unaffected;
    no-refund groups keep `available` byte-identical.
  - **B4/B5** (`:313`, `:330`) — unaffected; absence assertions on Ingresos/Gastos cards.
  - **A1–A7** (`SummaryCard` unit tests) — unaffected; prop names and Spanish labels preserved
    verbatim, `ahorroPotencial` prop name deliberately kept.
  - **`budgetRefund`'s other consumers** — Devoluciones SummaryCard "Presup." field (line 136)
    and `BudgetTableView`/`BudgetCardsView` still read `budgetRefund`/`budget` directly;
    confirm untouched and passing.
  *(finance-budget-summary: budgetRefund's other consumers are unaffected — Devoluciones card
  "Presup." is unaffected; Budget table and cards views are unaffected)*

## Phase 4: Real includes refunds (v3 — post-apply, live user review)

Phases 1–3 above shipped and were committed (`8de9712`). After reviewing the live app, the user
reversed one decision: the Neto card's "Real" value should show `realBalance` (refunds included)
instead of `actualNet` (refunds excluded). `computeBudgetSummary()` already computes and returns
`realBalance` — no domain-function change is required. This phase is consumption-side only.

- [x] 4.1 RED: add a `Real $1.100.000` assertion to test **B3** in `BudgetTab.test.tsx` (`:294`,
  "B3: renders 'Disponible $700.000' and 'Ahorro potencial $100.000' inside Neto card" — renamed
  to "B3: renders 'Real $1.100.000', 'Disponible $700.000' and 'Ahorro potencial $100.000' inside
  Neto card"):
  ```ts
  expect(within(netoCard).getByText("Real $1.100.000")).toBeTruthy();
  ```
  Confirmed failing against current code, which still renders `actual={actualNet}` →
  "Real $1.000.000".
  *(finance-budget-summary: the Neto card's "Real" displays realBalance — B3 gains a "Real"
  assertion protecting the realBalance display)*

- [x] 4.2 GREEN: in `features/finance/presentation/components/Budget/BudgetTab.tsx`, change the
  destructure from `computeBudgetSummary()` (`{ actualNet, available, potentialSavings }` →
  `{ realBalance, available, potentialSavings }`) and change the Neto `SummaryCard`'s `actual`
  prop from `actual={actualNet}` to `actual={realBalance}`. No import changes
  (`computeBudgetSummary` already imported). `disponible`/`ahorroPotencial` props unchanged. B3
  (4.1) passes.
  *(finance-budget-summary: the Neto card's "Real" displays realBalance)*

- [x] 4.3 Run `npm run test` — full suite green (358/358, 52 files), `tsc --noEmit` clean. Confirm
  **T4** (`:138`, "Neto excludes refunds → $400.000") stays green unchanged — its fixture uses
  `transactions={[]}`, so `actualNet === realBalance === 0` there, and the `$400.000` it asserts
  is the Neto **Presup.** figure, unaffected. Confirm all other Phase 1–3 tests (domain unit
  tests, B1/B2/B4/B5, A1–A7) still pass unchanged.

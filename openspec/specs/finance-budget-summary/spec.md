# Delta for Finance Budget Summary

## Purpose

Today, recording a real "devoluciones" (refund) transaction does not move the number the user
reads as their *monto restante real*. This capability makes the Neto card's remaining-amount
figures ("Disponible"/"Faltante" and "Ahorro potencial") reflect real refund transactions as soon
as they are recorded, and separates three previously-blurred concepts into named, documented,
independently-testable figures.

## Domain Glossary

Carried forward verbatim from the approved proposal (`proposal.md`, v2). All variable/function
names are English (existing codebase convention: English identifiers, Spanish UI labels). Amounts
are CLP integers.

| Variable (English)  | Meaning | Formula | UI label it feeds | Changed? |
|---------------------|---------|---------|-------------------|----------|
| `actualIncome`      | Real income received (sum of income transactions) | `sumActual(incomeGroups)` | "Ingresos → Real" | no |
| `actualExpense`     | Real expenses paid (sum of expense transactions) | `sumActual(expenseGroups)` | "Gastos → Real" | no |
| `actualRefund`      | Real refunds already received (sum of refund transactions) | `sumActual(refundGroups)` | "Devoluciones → Real" | no |
| `budgetRefund`      | Refunds *budgeted/expected* for the month (from budget inputs) | `sumBudget(refundGroups)` | "Devoluciones → Presup." | no |
| `pendingExpenses`   | Budgeted expenses not yet paid (per open category, floored at 0) | `computePendingExpenses(...)` | (feeds `available`) | no |
| `actualNet`         | Real income minus real expenses. **Refunds excluded, by design.** **(v3)** internal/intermediate value only — still computed, still the base for `realBalance`, but no longer displayed on any card. | `actualIncome − actualExpense` | (internal; feeds `realBalance`) | no (kept; **v3: internal-only**) |
| `realBalance`       | **NEW.** The real money in the account right now, refunds included. The true "what I actually have." | `actualNet + actualRefund` | **"Neto → Real"** (v3; also feeds `available`) | **new (v3: now the displayed "Real")** |
| `available`         | **REDEFINED.** The real remaining amount (*monto restante real*) after covering expenses still pending. This is the user's original ask. | `realBalance − pendingExpenses` | "Neto → Disponible / Faltante" | **redefined** |
| `potentialSavings`  | **REDEFINED** (was `ahorroPotencial`). Refund still *expected but not yet received* — the gap left to arrive. Can be negative when real refunds already exceeded budget. | `budgetRefund − actualRefund` | "Neto → Ahorro potencial" | **redefined** |

## ADDED Requirements

### Requirement: Real refund transactions move the real remaining amount reactively

The system MUST recompute `realBalance` and `available` from the current transaction list every
render, with no caching or staleness, matching the existing reactive pattern already used by
`computeActualFromTransactions.ts`. Adding a real "devoluciones" transaction MUST be reflected in
"Disponible" without any additional user action beyond the transaction being recorded.

#### Scenario: Adding a refund transaction updates Disponible immediately

- GIVEN a category belonging to a refund group has no transactions yet
- AND the Neto card currently shows a "Disponible" value computed without that refund
- WHEN a new transaction is added under that refund category
- THEN `actualRefund` MUST include the new transaction's amount
- AND `realBalance` (`actualNet + actualRefund`) MUST increase by that amount
- AND "Disponible" MUST reflect the increased `realBalance` on the next render, with no cache or
  stale value shown

### Requirement: `available` is computed from `realBalance` minus `pendingExpenses`

The system MUST compute `available` as `realBalance − pendingExpenses`, where
`realBalance = actualNet + actualRefund`. This replaces the old formula
(`actualNet − pendingExpenses`), which never let real refunds move the remaining amount.

#### Scenario: available reflects real refunds already received (B3 fixture)

- GIVEN `actualIncome = 1000000`, `actualExpense = 0`, `actualRefund = 100000`,
  `pendingExpenses = 400000`
- WHEN `available` is computed
- THEN `actualNet` MUST be `1000000` (`1000000 − 0`)
- AND `realBalance` MUST be `1100000` (`1000000 + 100000`)
- AND `available` MUST be `700000` (`1100000 − 400000`)
- AND the Neto card MUST render "Disponible $700.000"

### Requirement: `potentialSavings` is the still-expected refund gap

The system MUST compute `potentialSavings` as `budgetRefund − actualRefund` — the portion of the
budgeted/expected refund that has not yet arrived as a real transaction. This replaces the old
`ahorroPotencial` formula (`available + budgetRefund`), which mixed the remaining-amount figure
with a projection and used the wrong refund variable. `potentialSavings` MUST be allowed to go
negative when real refunds already exceed the budgeted refund, rendered with the existing
negative/red styling convention (`Math.abs()` + red).

#### Scenario: potentialSavings reflects the still-expected gap (B3 fixture)

- GIVEN `budgetRefund = 0` and `actualRefund = 100000` (same B3 fixture as above)
- WHEN `potentialSavings` is computed
- THEN `potentialSavings` MUST be `-100000` (`0 − 100000`)
- AND the Neto card MUST render "Ahorro potencial $100.000" using the existing negative/red
  styling (absolute value shown, red text)

### Requirement: `actualNet` computation is unaffected by refunds (v3: internal-only)

`actualNet` MUST continue to be computed as `actualIncome − actualExpense`, excluding refunds, by
design. This is a regression guard on the COMPUTATION: the redefinition of `available` and
`potentialSavings`, and the v3 change to the "Real" display, MUST NOT change how `actualNet` is
computed. **(v3)** `actualNet` is now an internal/intermediate value only — it is the base for
`realBalance` and is no longer the value fed to any card's "Real" label (see the new requirement
"The Neto card's 'Real' displays `realBalance`"). The old assertion that `actualNet` feeds "Neto →
Real" is superseded.

#### Scenario: actualNet excludes refunds regardless of refund activity

- GIVEN a refund group with real refund transactions exists alongside income and expense groups
- WHEN `actualNet` is computed
- THEN `actualNet` MUST equal `actualIncome − actualExpense` only, with `actualRefund` playing no
  part in the formula
- AND `realBalance` (`actualNet + actualRefund`) MUST be the value displayed as "Neto → Real", not
  `actualNet` itself

#### Scenario: T4 "Neto excludes refunds" stays green unchanged under v3

- GIVEN the existing T4 test (`BudgetTab.test.tsx:138`) whose fixture supplies
  `initialBudget = { Peter: 1000000, Isapre: 100000, Arriendo: 600000 }` with `transactions = []`
- AND therefore `actualIncome = actualExpense = actualRefund = 0`, so `actualNet = 0` and
  `realBalance = 0`
- WHEN the Neto card renders and the test asserts a `$400.000` value scoped to that card
- THEN that `$400.000` MUST be the Neto **Presup.** figure (`budgetIncome − budgetExpense = 1000000 −
  600000`), NOT `actualNet` and NOT the "Real" line
- AND because the "Real" line is `$0` under both `actualNet` and `realBalance` here, the v3 change
  MUST leave T4 passing WITHOUT any rewrite
- AND the earlier delegation note claiming T4 must be rewritten to assert `$500.000` is INCORRECT (it
  misread `initialBudget` as transactions); there is no `$500.000` and no in-scope edit to T4

### Requirement: `budgetRefund`'s other consumers are unaffected

`budgetRefund` MUST continue to be computed exactly as today (`sumBudget(refundGroups)`) and MUST
continue to drive the Devoluciones SummaryCard's "Presup." field and the budget table/cards views
(`BudgetTableView`, `BudgetCardsView`) unchanged. Only the Neto card's `available` and
`potentialSavings` consumers change; no other consumer of `budgetRefund` is affected.

#### Scenario: Devoluciones card "Presup." is unaffected

- GIVEN a refund group has a budgeted amount and real refund transactions
- WHEN the Devoluciones SummaryCard renders
- THEN its "Presup." value MUST still equal `sumBudget(refundGroups)`, unchanged by this change

#### Scenario: Budget table and cards views are unaffected

- GIVEN a refund group with budgeted and real amounts
- WHEN the budget table view (`BudgetTableView`) and the mobile cards view (`BudgetCardsView`)
  render the Devoluciones section
- THEN both views MUST continue to show the same per-category budget, real, and diff values as
  before this change

### Requirement: B3 test assertions are updated as an intended behavior change

The existing test at `BudgetTab.test.tsx:292` ("B3: renders 'Ahorro potencial $700.000' inside
Neto card") asserts the old, incorrect behavior. Updating its assertions to match the redefined
formulas is IN SCOPE for this change and MUST NOT be treated as an accidental regression during
implementation or verification.

#### Scenario: B3 is rewritten to assert the corrected values

- GIVEN the B3 fixture (`initialBudget={{ Arriendo: 400000 }}`, transactions
  `[Peter +1000000 income, Isapre +100000 refund]`)
- WHEN the Neto card renders under the redefined formulas
- THEN the test MUST assert "Disponible $700.000" (not "Ahorro potencial $700.000")
- AND the test MUST also assert "Ahorro potencial $100.000" rendered in the negative/red style
- AND this reassignment of the `700000` value from "Ahorro potencial" to "Disponible" MUST be
  understood as the deliberate fix this change delivers, not a broken test

## ADDED Requirements (v3 — post-apply, live user review)

### Requirement: The Neto card's "Real" displays `realBalance` (refunds included)

The Neto `SummaryCard`'s `actual` prop (the "Real" line) MUST be fed from `realBalance`
(`actualNet + actualRefund`), NOT from `actualNet`. Recording a real "devoluciones" transaction MUST
therefore increase the Neto "Real" figure, giving the user a truer *monto restante real*. This
supersedes the prior behavior where "Real" showed `actualNet` (refunds excluded). This is a
consumption-side change only: `computeBudgetSummary()` already computes and returns `realBalance`, so
no domain-function change is required — `BudgetTab.tsx` destructures `realBalance` and passes it to
the `actual` prop.

`available` (Disponible/Faltante) and `potentialSavings` (Ahorro potencial) MUST remain exactly as in
Phases 1–3 — they already reflect refunds correctly and are NOT changed by this requirement.

#### Scenario: Neto "Real" reflects real refunds (worked example, user's live numbers)

- GIVEN `actualIncome = 3121580`, `actualExpense = 2382113`, `actualRefund = 81000`,
  `budgetRefund = 579500`, `pendingExpenses = 1120829`
- WHEN `computeBudgetSummary` runs and the Neto card renders
- THEN `actualNet` MUST be `739467` (`3121580 − 2382113`) — internal only, not displayed
- AND `realBalance` MUST be `820467` (`739467 + 81000`) and MUST be shown as **"Real $820.467"**
- AND `available` MUST be `-300362` (`820467 − 1120829`), shown as **"Faltante $300.362"** (unchanged
  formula — already correct before v3)
- AND `potentialSavings` MUST be `498500` (`579500 − 81000`), shown as **"Ahorro potencial
  $498.500"** (unchanged formula — already correct before v3)

#### Scenario: B3 gains a "Real" assertion protecting the realBalance display (in-scope test delta)

- GIVEN the B3 fixture (`initialBudget = { Arriendo: 400000 }`, transactions
  `[Peter +1000000 income, Isapre +100000 refund]`), so `actualNet = 1000000`,
  `actualRefund = 100000`, `realBalance = 1100000`
- WHEN the Neto card renders under the v3 change
- THEN the "Real" line MUST show `realBalance`, i.e. **"Real $1.100.000"** (not "Real $1.000.000")
- AND the B3 test MUST gain an assertion for `Neto "Real $1.100.000"` — this is the ONLY test edit
  the v3 reversal requires; T4 stays green untouched
- AND B3's existing "Disponible $700.000" and "Ahorro potencial $100.000" assertions MUST still pass
  unchanged (the v3 change touches only the "Real" line)

## Non-Goals

- No re-labeling of "Disponible", "Faltante", "Ahorro potencial", or "Neto".
- No layout/positioning changes to any card, and no change to how `available`/`potentialSavings`
  are visually rendered beyond their computed values (existing `Math.abs()` + red/green styling is
  reused as-is).
- No changes to the Ingresos or Gastos cards' behavior.
- No changes to Ingresos/Gastos/Devoluciones card behavior beyond what is explicitly listed above.

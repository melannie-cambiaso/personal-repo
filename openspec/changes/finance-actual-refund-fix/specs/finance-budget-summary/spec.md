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
| `actualNet`         | Real income minus real expenses. **Refunds excluded, by design.** | `actualIncome − actualExpense` | "Neto → Real" | no (kept) |
| `realBalance`       | **NEW.** The real money in the account right now, refunds included. The true "what I actually have." | `actualNet + actualRefund` | (internal; feeds `available`) | **new** |
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

### Requirement: `actualNet` remains unaffected by refunds

`actualNet` MUST continue to be computed as `actualIncome − actualExpense`, excluding refunds, by
design. This is a regression guard: the redefinition of `available` and `potentialSavings` MUST
NOT change how `actualNet` ("Neto → Real") is computed or displayed.

#### Scenario: Neto excludes refunds regardless of refund activity

- GIVEN a refund group with real refund transactions exists alongside income and expense groups
- WHEN `actualNet` is computed
- THEN `actualNet` MUST equal `actualIncome − actualExpense` only, with `actualRefund` playing no
  part in the formula
- AND the existing "Neto excludes refunds" test scenario (income=1000000, refund=100000,
  expense=600000 → Neto=$400.000) MUST keep passing unchanged

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

## Non-Goals

- No re-labeling of "Disponible", "Faltante", "Ahorro potencial", or "Neto".
- No layout/positioning changes to any card, and no change to how `available`/`potentialSavings`
  are visually rendered beyond their computed values (existing `Math.abs()` + red/green styling is
  reused as-is).
- No changes to the Ingresos or Gastos cards' behavior.
- No changes to Ingresos/Gastos/Devoluciones card behavior beyond what is explicitly listed above.

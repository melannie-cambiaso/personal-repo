# Feature: finance-v2 budget remaining vs month balance

Locator: `odd/tasks/finance-v2-budget-remaining.md` · Engram mirror: `odd/finance-v2-budget-remaining/tasks`
Branch: `feat/finance-v2-budget-remaining`

## Objective
In the Budget tab, show how much budget is left to spend and compare what still has to be paid
from the main account with the month's balance, so the user does not need a calculator.

## Problem / Why
`BucketComparison` shows "spent de budgeted" per bucket. To know what is left, and whether the
money in the account covers it, the user subtracts by hand.

## Decisions (user-confirmed 2026-10-03)
- Compare against the existing month-scoped main balance (`computeTransactionTotals().balance`:
  income − expense − savings − transfer for the viewed month). No real bank balance / carry-over.
- Exclude the envelope's bound category (e.g. "Cuentas") and its subcategories from the pending
  amount: those bills are paid from the envelope, not the main account.
- (agent design) Pending from main = Σ over budget leaves outside the bound category of
  `max(budgeted − spent, 0)`. Overspent leaves count 0 (their excess already left the balance).
  Ahorro leaves are included (savings also leave the main balance).
- (agent design) `SpendPairing` adds " · quedan $X" when not overrun and something remains, so
  bucket rows and category cards both show it. Overrun keeps " · excedido en $X".
- (agent design) New summary block under the Total row: pending from the account, month balance,
  and "Te sobran $X" (green) / "Te faltan $X" (red). When an envelope is configured, a muted note
  says the bound category is excluded because it is paid from the envelope.

## Constraints
- Hexagonal layout: pure domain functions in `domain/`, UI in `presentation/`.
- UI copy in Spanish, matching existing finance-v2 copy.
- Same viewed month / same transactions as the rest of `FinanceV2Screen`.
- Loading state never renders a false figure (design D7: `LoadingSpend`).

## TDD
Mode: on · Runner: `vitest run` (`npm run test`)

## Delivery
Single branch with chained work-unit commits, fast-forward to `main` when done (user flow).

## Tasks
- [x] T1 — Domain: `computePendingFromMain` (leaf-level remaining, bound-category exclusion, overspent clamp) + tests. Takes `EnvelopeConfig | null` to reuse `resolvePaidFrom`. 8 tests, RED→GREEN observed.
- [ ] T2 — `SpendPairing` "quedan $X" + tests (SpendPairing, BucketComparison, BudgetCategoryCard expectations).
- [ ] T3 — Budget tab summary block (pending / balance / sobran-faltan, envelope note) wired from `FinanceV2Screen` + tests.
- [ ] T4 — Verify: full `npm run test`, `npm run build`, lint on touched dirs.

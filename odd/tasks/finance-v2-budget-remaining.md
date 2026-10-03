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
- [x] T1 — Domain: `computePendingFromMain` (leaf-level remaining, bound-category exclusion, overspent clamp) + tests. Takes `EnvelopeConfig | null` to reuse `resolvePaidFrom`. 8 tests, RED→GREEN observed. Commit `b90d0c0`.
- [x] T2 — `SpendPairing` "quedan $X" + tests (SpendPairing, BucketComparison, BudgetCategoryCard expectations). 4 new SpendPairing tests + BucketComparison row test; RED→GREEN, presentation suite 234/234. Commit `522cf42`.
- [x] T3 — Budget tab summary block (pending / balance / sobran-faltan, envelope note) wired from `FinanceV2Screen` + tests. New `AccountCoverage` + `toAccountCoverageView`; pending memoized in `FinanceV2Screen`; RED→GREEN, finance-v2 suite 458/458, tsc clean. Commit `240d5e4`.
- [x] T4 — Verify: full `npm run test`, `npm run build`, lint on touched dirs. Tests 891/891, build green. eslint finance-v2: 1 pre-existing error in `useFinanceV2Transactions.ts:71` (react-hooks/refs), file untouched by this branch. Commit `f40990c`.
- [x] T5 — Drop the "de $Y" budgeted suffix from every `SpendPairing` row (user feedback 2026-10-03: too dense); rows read "$spent · quedan $X" / "$spent · excedido en $X". RED→GREEN; presentation suite 247/247, tsc clean. Budget stays visible only in edit mode.

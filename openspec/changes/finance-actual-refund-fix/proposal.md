# Proposal: Reflect real "devoluciones" in the real remaining balance (v2 — domain redesign)

> **Revision note (v2):** This proposal supersedes the original one-line-swap draft. After the
> first draft, the user clarified what the numbers *should mean*. That clarification turns this from
> a single wrong-variable bug fix into a small, well-defined domain redesign of the "Neto" card
> figures. The old "Approach 1 vs Approach 2" fork is now moot — a pure domain function is required.

## Intent

User ask (verbatim, Spanish): *"necesito que cuando yo agregue una transacción a devoluciones se vea
en el monto restante real que tengo"* — when I add a transaction under "devoluciones" (refunds), it
should show up in the real remaining amount I have.

Today, recording a real refund transaction does **not** move the number the user reads as their
*monto restante real*. In `BudgetTab.tsx`, the "Ahorro potencial" figure is computed from
`budgetRefund` (the *planned* refund typed into the budget input) instead of `actualRefund` (the sum
of *real* refund transactions). But the clarification revealed the defect is deeper than one wrong
variable: the card was conflating three distinct concepts into two blurred figures. The user wants
these concepts separated and each one **documented in writing**.

## Domain Glossary (authoritative — carry into design.md)

All variable/function names are **English** (existing codebase convention: English identifiers,
Spanish UI labels). Amounts are CLP integers.

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

Key shift from the old code:
- Old `available = actualNet − pendingExpenses` (refunds never entered) → new `available` routes
  through `realBalance`, so real refunds now DO move the remaining amount. This is the fix.
- Old `ahorroPotencial = available + budgetRefund` (a mixed "available + a projection" blend, with
  the wrong refund variable) → new `potentialSavings = budgetRefund − actualRefund` (a clean
  "expected minus received" gap).

## Scope

### In Scope
- Introduce `realBalance` (new) and `potentialSavings` (renames + redefines `ahorroPotencial`).
- Redefine `available` to compute against `realBalance` instead of raw `actualNet`.
- Keep `actualNet`, `budgetRefund`, `actualRefund` **as computed today** — only their *consumers*
  change. `actualNet` still feeds "Neto → Real" unchanged.
- Extract this arithmetic into a pure domain function (see Approach) under
  `features/finance/domain/`, returning the documented figures, and unit-test it per the project's
  TDD convention.
- Rewrite the one existing test whose asserted behavior changes (**B3** — see Impact).

### Out of Scope
- No change to the SummaryCard layout, card positions, labels, or the negative-value styling
  (`Math.abs()` + red/green) — the component already renders negatives correctly.
- No change to the Ingresos / Gastos / Devoluciones cards.
- No data-model, KV-adapter, or `financeActions` changes — the transaction pipeline already works
  and is reactive.
- No new "budgeted vs real side-by-side" display.

## Approach — extract a pure domain function

Because this is now **three interdependent figures** (`realBalance`, `available`, `potentialSavings`)
that all depend on the same inputs, inlining them in the component is the wrong altitude. Recommend a
single pure function in `features/finance/domain/`, matching the existing hexagonal pattern already
used by `computeActualFromTransactions.ts` and `computePendingExpenses.ts`:

```ts
// features/finance/domain/computeBudgetSummary.ts
export interface BudgetSummary {
  actualNet: number;        // actualIncome − actualExpense (refunds excluded)
  realBalance: number;      // actualNet + actualRefund
  potentialSavings: number; // budgetRefund − actualRefund
  available: number;        // realBalance − pendingExpenses
  pendingExpenses: number;  // passed through for the caller
}

export function computeBudgetSummary(input: {
  actualIncome: number;
  actualExpense: number;
  actualRefund: number;
  budgetRefund: number;
  pendingExpenses: number;
}): BudgetSummary { /* ... */ }
```

`BudgetTab.tsx` then calls this once and destructures, instead of hand-computing `actualNet` /
`available` / `ahorroPotencial` inline. This is directly unit-testable (satisfies the project's
Strict TDD convention), keeps the glossary meanings in one documented place, and removes the last
piece of finance domain math still living in a presentation component.

The old "one-line swap vs domain extraction" decision is **not** re-opened — the redefinition makes a
domain function the only clean option. No user decision is required to proceed to spec/design.

## Impact on existing tests

Baseline verified by running the suite: **26 pass, 1 fails (B3)** before any change.

| Test | File / line | Status under redefinition | Why |
|------|-------------|---------------------------|-----|
| **B3** — "Ahorro potencial $700.000" | `BudgetTab.test.tsx:292` | **Must be rewritten** (deliberate behavior change) | Under the new model the `700000` moves to **"Disponible"**, and "Ahorro potencial" becomes `budgetRefund(0) − actualRefund(100000) = −100000`, rendered `Ahorro potencial $100.000` in red. New assertions: `Disponible $700.000` **and** `Ahorro potencial $100.000`. |
| **B1** — "Disponible $600.000" | `:260` | **Unaffected** | No refund group → `actualRefund=0` → `realBalance = actualNet`, so `available` is identical (600000). |
| **B2** — "Faltante $400.000" | `:276` | **Unaffected** | Same reason — no refunds, `available = 200000 − 600000 = −400000`. |
| **B4** — Ingresos hides Disponible/Ahorro | `:313` | **Unaffected** | Absence assertion; those props are never passed to the Ingresos card. |
| **B5** — Gastos hides Disponible/Ahorro | `:330` | **Unaffected** | Same as B4. |
| **T4** — "Neto excludes refunds → $400.000" | `:138` | **Unaffected** | `$400.000` is the Neto **Presup.** figure (`budgetIncome − budgetExpense`), and `actualNet` is unchanged (0, empty transactions). The test does not assert Disponible/Ahorro, and `$400.000` stays unique in the card. |
| **A1–A7** — SummaryCard unit tests | `:40–87` | **Unaffected** (presentation-only) | They render `SummaryCard` with explicit props and assert labels. They pass as long as the card's prop names and Spanish labels are preserved. *If* design later renames the `ahorroPotencial` prop to `potentialSavings`, A4/A5 update mechanically — a rename, not a behavior change. |

**Net: exactly one test (B3) changes assertions.** It is a deliberate, understood behavior change
(the correct separation of Disponible vs Ahorro potencial), not a regression. It is flagged here so
it is not mistaken for a broken test during apply.

### Worked trace (B3 fixture — independently re-verified against source)

Fixture: `initialBudget={{ Arriendo: 400000 }}`, transactions `[Peter +1000000 income, Isapre +100000 refund]`.
- `budgetRefund = 0` (Isapre not budgeted), `actualRefund = 100000`, `actualIncome = 1000000`,
  `actualExpense = 0`, `pendingExpenses = max(0, 400000 − 0) = 400000`.
- `actualNet = 1000000 − 0 = 1000000` (unchanged; still feeds "Neto → Real").
- `realBalance = 1000000 + 100000 = 1100000`.
- `available = 1100000 − 400000 = 700000` → **"Disponible $700.000"**.
- `potentialSavings = 0 − 100000 = −100000` → **"Ahorro potencial $100.000"** (red).

Old buggy value confirmed by the live test failure: `ahorroPotencial = available(600000) + budgetRefund(0) = 600000`.

## Non-Goals

- No re-labeling of "Disponible", "Faltante", "Ahorro potencial", or "Neto".
- No layout/positioning changes to any card.
- No changes to Ingresos / Gastos / Devoluciones cards or to the transaction plumbing.

## Rollback Plan

Revert is: delete `computeBudgetSummary.ts` (+ its test), restore the inline arithmetic in
`BudgetTab.tsx`, and restore the original B3 assertion. No data/schema migration involved.

## Success Criteria

- [ ] Adding a real "devoluciones" transaction increases `available` ("Disponible") — the *monto
      restante real* — reflecting money actually received.
- [ ] "Ahorro potencial" shows only the still-expected refund gap (`budgetRefund − actualRefund`),
      negative-styled when actual refunds exceed budget.
- [ ] `actualNet` ("Neto → Real") is unchanged; "Neto excludes refunds" (T4) stays green.
- [ ] B3 rewritten to assert `Disponible $700.000` and `Ahorro potencial $100.000`, and passes.
- [ ] `computeBudgetSummary` has direct unit tests; full suite green (`npm run test`).
- [ ] `budgetRefund` still drives "Devoluciones → Presup." and the budget table/cards views.

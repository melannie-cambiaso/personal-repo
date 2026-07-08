# Proposal: Reflect real "devoluciones" in the real remaining balance (v3 — Neto "Real" shows realBalance)

> **Revision note (v2):** This proposal supersedes the original one-line-swap draft. After the
> first draft, the user clarified what the numbers *should mean*. That clarification turns this from
> a single wrong-variable bug fix into a small, well-defined domain redesign of the "Neto" card
> figures. The old "Approach 1 vs Approach 2" fork is now moot — a pure domain function is required.

> **Revision note (v3 — post-apply, live review):** Phases 1–3 (the `computeBudgetSummary()`
> extraction and the `available`/`potentialSavings` redefinition) were already applied and committed
> (`8de9712`). Afterward the user ran the real app with real numbers and reversed ONE prior decision:
> the Neto card's **"Real"** value should now show **`realBalance`** (= `actualNet + actualRefund`,
> refunds INCLUDED), not `actualNet` (refunds excluded). See the "Post-apply reversal (v3)" section
> below. This is a deliberate, user-confirmed change ("si, prefiero que sea realBalance"), not a bug.
> `available` (Disponible/Faltante) and `potentialSavings` (Ahorro potencial) are UNCHANGED — they
> already reflect refunds correctly and were verified against the live screenshot numbers.

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
| `actualNet`         | Real income minus real expenses. **Refunds excluded, by design.** **(v3)** Now an **internal/intermediate** value only — still computed and still the base for `realBalance`, but no longer displayed directly on any card. | `actualIncome − actualExpense` | (internal; feeds `realBalance`) | no (kept; **v3: now internal-only**) |
| `realBalance`       | **NEW.** The real money in the account right now, refunds included. The true "what I actually have." | `actualNet + actualRefund` | **"Neto → Real"** (v3; also feeds `available`) | **new (v3: now the displayed "Real")** |
| `available`         | **REDEFINED.** The real remaining amount (*monto restante real*) after covering expenses still pending. This is the user's original ask. | `realBalance − pendingExpenses` | "Neto → Disponible / Faltante" | **redefined** |
| `potentialSavings`  | **REDEFINED** (was `ahorroPotencial`). Refund still *expected but not yet received* — the gap left to arrive. Can be negative when real refunds already exceeded budget. | `budgetRefund − actualRefund` | "Neto → Ahorro potencial" | **redefined** |

Key shift from the old code:
- Old `available = actualNet − pendingExpenses` (refunds never entered) → new `available` routes
  through `realBalance`, so real refunds now DO move the remaining amount. This is the fix.
- Old `ahorroPotencial = available + budgetRefund` (a mixed "available + a projection" blend, with
  the wrong refund variable) → new `potentialSavings = budgetRefund − actualRefund` (a clean
  "expected minus received" gap).

## Post-apply reversal (v3): Neto "Real" now shows `realBalance`

**What changed.** After Phases 1–3 shipped (`8de9712`), the user opened the live app and read the
real Neto card. With refunds excluded, the "Real" figure did not match the money actually in the
account, so the user asked that "Real" INCLUDE devoluciones — i.e. display `realBalance`
(`actualNet + actualRefund`) rather than `actualNet`. Confirmed verbatim: *"si, prefiero que sea
realBalance"*.

**Why.** The card is the user's at-a-glance "monto restante real". Showing `actualNet` (income −
expense, refunds excluded) as "Real" undercounts by the refunds already received. `realBalance` is
the truer "what I actually have right now", consistent with the same intent that drove the original
`available` redefinition.

**Worked example (user's live numbers).**

| Input | Value |
|-------|-------|
| `actualIncome` | 3.121.580 |
| `actualExpense` | 2.382.113 |
| `actualRefund` | 81.000 |
| `budgetRefund` | 579.500 |
| `pendingExpenses` | 1.120.829 |

- `actualNet = 3.121.580 − 2.382.113 = 739.467` (internal only — no longer shown)
- `realBalance = 739.467 + 81.000 = 820.467` → **"Real $820.467"** (this is the v3 change)
- `available = 820.467 − 1.120.829 = −300.362` → **"Faltante $300.362"** (already correct, unchanged)
- `potentialSavings = 579.500 − 81.000 = 498.500` → **"Ahorro potencial $498.500"** (already correct, unchanged)

**Blast radius: one prop value.** `computeBudgetSummary()` ALREADY computes and returns `realBalance`
(built in Phase 2 per the original design). This is a pure consumption-side change in `BudgetTab.tsx`:
destructure `realBalance` from the existing call and feed the Neto `SummaryCard`'s `actual` prop from
`realBalance` instead of `actualNet`. No domain-function change. `available` and `potentialSavings`
are untouched.

**Test impact (corrected — see Impact section for the earlier misread).** The existing T4 test
("Neto excludes refunds", `BudgetTab.test.tsx:138`) stays GREEN **unchanged**: its fixture uses
`initialBudget` with `transactions={[]}`, so its `$400.000` assertion is the Neto **Presup.** figure
(`budgetIncome − budgetExpense`), not `actualNet`, and `actualNet`/`realBalance` are both `$0` there.
The realBalance display is currently UI-untested; the in-scope test delta is to ADD a `Neto
"Real $1.100.000"` assertion to B3 (`:294`), whose fixture already has a real refund transaction
(`actualNet=1.000.000` → `realBalance=1.100.000`).

## Scope

### In Scope
- Introduce `realBalance` (new) and `potentialSavings` (renames + redefines `ahorroPotencial`).
- Redefine `available` to compute against `realBalance` instead of raw `actualNet`.
- **(v3)** Feed the Neto card's "Real" (`SummaryCard` `actual` prop) from `realBalance` instead of
  `actualNet`. `actualNet` becomes internal-only.
- Keep `actualNet`, `budgetRefund`, `actualRefund` **as computed today** — only their *consumers*
  change. `actualNet` is still computed (it is the base for `realBalance`); **v3:** it is no longer
  displayed directly.
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
| **T4** — "Neto excludes refunds → $400.000" | `:138` | **Unaffected (incl. v3)** | `$400.000` is the Neto **Presup.** figure (`budgetIncome − budgetExpense`), and `actualNet` is unchanged (0, empty transactions). The test does not assert Disponible/Ahorro, and `$400.000` stays unique in the card. **v3 note:** the reversal changes the "Real" line to `realBalance`, but with `transactions={[]}` both `actualNet` and `realBalance` are `$0`, so T4 remains green with NO rewrite. (The earlier delegation summary that said T4 must be rewritten to `$500.000` misread `initialBudget` as transactions — there is no `$500.000`.) |
| **A1–A7** — SummaryCard unit tests | `:40–87` | **Unaffected** (presentation-only) | They render `SummaryCard` with explicit props and assert labels. They pass as long as the card's prop names and Spanish labels are preserved. *If* design later renames the `ahorroPotencial` prop to `potentialSavings`, A4/A5 update mechanically — a rename, not a behavior change. |

**Net: exactly one test (B3) changes assertions.** It is a deliberate, understood behavior change
(the correct separation of Disponible vs Ahorro potencial), not a regression. It is flagged here so
it is not mistaken for a broken test during apply.

### Worked trace (B3 fixture — independently re-verified against source)

Fixture: `initialBudget={{ Arriendo: 400000 }}`, transactions `[Peter +1000000 income, Isapre +100000 refund]`.
- `budgetRefund = 0` (Isapre not budgeted), `actualRefund = 100000`, `actualIncome = 1000000`,
  `actualExpense = 0`, `pendingExpenses = max(0, 400000 − 0) = 400000`.
- `actualNet = 1000000 − 0 = 1000000` (computation unchanged; **v3:** now internal, feeds `realBalance`).
- `realBalance = 1000000 + 100000 = 1100000` → **v3:** shown as **"Neto → Real $1.100.000"**.
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
- [ ] **(Phases 1–3, done)** `actualNet` computation is unchanged; "Neto excludes refunds" (T4)
      stays green.
- [ ] **(v3)** The Neto card's "Real" shows `realBalance` (refunds included), not `actualNet`; B3
      gains a `Neto "Real $1.100.000"` assertion that passes, and T4 stays green unchanged.
- [ ] B3 rewritten to assert `Disponible $700.000` and `Ahorro potencial $100.000`, and passes.
- [ ] `computeBudgetSummary` has direct unit tests; full suite green (`npm run test`).
- [ ] `budgetRefund` still drives "Devoluciones → Presup." and the budget table/cards views.

# Design: Extract `computeBudgetSummary()` for the Neto card figures

## Technical Approach

Extract the three interdependent Neto-card figures (`actualNet`, `realBalance`, `available`,
`potentialSavings`) out of `BudgetTab.tsx` and into a single pure domain function
`features/finance/domain/computeBudgetSummary.ts`, matching the existing hexagonal pattern already
used by `computeActualFromTransactions.ts` and `computePendingExpenses.ts`. The function takes the
already-computed per-group scalars (`actualIncome`, `actualExpense`, `actualRefund`, `budgetRefund`,
`pendingExpenses`) and returns the documented `BudgetSummary` figures. `BudgetTab.tsx` keeps
computing those input scalars exactly as today (`sumBudget`/`sumActual` over the filtered groups) and
just feeds them into the new function, replacing its inline arithmetic at lines 87–89.

Nothing else moves. The `SummaryCard` component, its prop names, its Spanish labels, and its
negative/red styling are untouched — only the *value* fed into the existing `ahorroPotencial` prop
changes (from the old blended figure to the new `potentialSavings`). This is the smallest edit that
delivers the redefinition while keeping the presentation-only tests (A1–A7) green verbatim.

## Architecture Decisions

### Decision: Object parameter, not positional args

**Choice**: `computeBudgetSummary(input: { actualIncome; actualExpense; actualRefund; budgetRefund;
pendingExpenses })` — a single named-field object, as already specified in the approved proposal.

**Alternatives**: Positional args `computeBudgetSummary(actualIncome, actualExpense, actualRefund,
budgetRefund, pendingExpenses)`, matching the positional style of `computePendingExpenses` and
`computeActualFromTransactions`.

**Rationale**: The sibling functions are positional because they take ≤4 arguments of *distinct*
shapes (records, arrays). This function takes **five same-typed `number` arguments**, where a
call-site ordering mistake (e.g. swapping `actualRefund` and `budgetRefund`) would be silent and
type-checks clean. A named-field object makes each input self-documenting at the call site and in the
tests, and lets the fixtures read like the Domain Glossary. This is the one deliberate deviation from
the sibling convention, and it is justified by arg count + type ambiguity. The proposal already
approved this shape.

### Decision: Return `realBalance` and `pendingExpenses` in the result even though `BudgetTab` destructures only three fields

**Choice**: `BudgetSummary` carries all five documented figures (`actualNet`, `realBalance`,
`potentialSavings`, `available`, `pendingExpenses`); `BudgetTab.tsx` destructures only the three it
renders (`actualNet`, `available`, `potentialSavings`).

**Rationale**: `realBalance` is the load-bearing new concept the glossary documents; exposing it (and
the passed-through `pendingExpenses`) keeps the function's contract aligned with the glossary and
makes it directly assertable in unit tests without forcing the component to consume everything.
Carrying the full result costs nothing and keeps the glossary and the type in lockstep.

### Decision: Keep the `ahorroPotencial` prop name on `SummaryCard`; only change the value

**Choice**: `BudgetTab` passes `ahorroPotencial={potentialSavings}` — the prop keeps its current name,
the value it receives is the newly-computed `potentialSavings`.

**Alternatives**: Rename the `SummaryCard` prop `ahorroPotencial` → `potentialSavings`.

**Rationale**: The label rendered is still "Ahorro potencial" (Non-Goal: no relabeling), and the
`SummaryCard` unit tests A4/A5 assert against the `ahorroPotencial` prop. Renaming the prop would
force a mechanical rewrite of A4/A5 for zero behavior gain. Keeping the prop name confines this change
to exactly the two files that must change (the new domain file + `BudgetTab`) plus the two test files,
and leaves A1–A7 passing verbatim. `available` already flows through the `disponible` prop unchanged.

## Domain Formulas (carried verbatim from proposal.md / spec.md Glossary — do not redefine)

| Figure | Formula |
|--------|---------|
| `actualNet` | `actualIncome − actualExpense` (refunds excluded, by design — unchanged) |
| `realBalance` | `actualNet + actualRefund` (**new**) |
| `available` | `realBalance − pendingExpenses` (**redefined**; was `actualNet − pendingExpenses`) |
| `potentialSavings` | `budgetRefund − actualRefund` (**redefined**; was `available + budgetRefund`) |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `features/finance/domain/computeBudgetSummary.ts` | Create | `BudgetSummary` interface + pure `computeBudgetSummary()` returning the four figures + passed-through `pendingExpenses` |
| `features/finance/domain/computeBudgetSummary.test.ts` | Create | Vitest unit tests: B3 fixture + boundary/no-refund/negative cases |
| `features/finance/domain/index.ts` | Modify | Add `export { computeBudgetSummary }` and `export type { BudgetSummary }` |
| `features/finance/presentation/components/Budget/BudgetTab.tsx` | Modify | Import `computeBudgetSummary`; replace inline lines 87–89 with one call + destructure; feed `potentialSavings` into the `ahorroPotencial` prop |
| `features/finance/presentation/components/Budget/BudgetTab.test.tsx` | Modify | Rewrite B3 (`:292`) assertions only |

## Interfaces

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
}): BudgetSummary;
```

### Integration point in `BudgetTab.tsx`

Everything above line 87 stays (the `sumBudget`/`sumActual` scalars, `pendingExpenses`,
`pendingAmount`). Lines 87–89 change from:

```ts
const actualNet = actualIncome - actualExpense;
const available = actualNet - pendingExpenses;
const ahorroPotencial = available + budgetRefund;
```

to:

```ts
const { actualNet, available, potentialSavings } = computeBudgetSummary({
  actualIncome,
  actualExpense,
  actualRefund,
  budgetRefund,
  pendingExpenses,
});
```

and the `SummaryCard` for "Neto" (line 134) changes only its prop value:
`ahorroPotencial={ahorroPotencial}` → `ahorroPotencial={potentialSavings}`. The `disponible={available}`
prop is unchanged in name and now carries the redefined `available`. The import on line 6 adds
`computeBudgetSummary` to the existing `@/features/finance/domain` import.

## Phase 4 (v3): Neto "Real" shows `realBalance` (post-apply follow-up)

Phases 1–3 above are **done and committed** (`8de9712`). Phase 4 is a smaller, separate delta added
after the user reviewed the live app and decided the Neto card's "Real" should INCLUDE devoluciones —
i.e. display `realBalance` (`actualNet + actualRefund`) instead of `actualNet`. See proposal v3 and
the spec requirement "The Neto card's 'Real' displays `realBalance`".

**This is purely consumption-side.** `computeBudgetSummary()` ALREADY computes and returns
`realBalance` (confirmed in `features/finance/domain/computeBudgetSummary.ts`, line 19/23) — it was
built into the Phase 2 domain function per the original design's "Return breadth" decision. So Phase 4
adds NO domain-function change; it only changes what `BudgetTab.tsx` consumes.

### Phase 4 file changes

| File | Action | Description |
|------|--------|-------------|
| `features/finance/presentation/components/Budget/BudgetTab.tsx` | Modify | Add `realBalance` to the existing `computeBudgetSummary()` destructure (currently `{ actualNet, available, potentialSavings }`); change the Neto `SummaryCard` `actual` prop from `actual={actualNet}` to `actual={realBalance}`. |
| `features/finance/presentation/components/Budget/BudgetTab.test.tsx` | Modify | Add one assertion to B3 (`:294`): `Neto "Real $1.100.000"` (realBalance = 1000000 + 100000). No other test changes; T4 stays green untouched. |

### Phase 4 integration point in `BudgetTab.tsx`

The destructure at lines 91–97 changes from:

```ts
const { actualNet, available, potentialSavings } = computeBudgetSummary({ ... });
```

to include `realBalance`:

```ts
const { realBalance, available, potentialSavings } = computeBudgetSummary({ ... });
```

`actualNet` is no longer destructured (it becomes internal to the domain function). The Neto
`SummaryCard` (lines 137–143) changes one prop value: `actual={actualNet}` → `actual={realBalance}`.
The `budget`, `disponible={available}`, and `ahorroPotencial={potentialSavings}` props are unchanged.
No import changes (`computeBudgetSummary` is already imported).

> Note: if any lingering reference to `actualNet` remains after the swap, either drop it from the
> destructure or keep it — but it is no longer read by the render. The minimal edit drops it.

## Testing Strategy

Strict TDD (vitest). Two RED→GREEN cycles, in order.

### Cycle 1 — domain function (unit)

1. **RED** — create `computeBudgetSummary.test.ts` (style mirrors `computePendingExpenses.test.ts`:
   `import { describe, it, expect } from "vitest"`, relative import `./computeBudgetSummary`,
   `describe("computeBudgetSummary", () => {...})`). Cases:
   - **B3 fixture**: `{ actualIncome: 1000000, actualExpense: 0, actualRefund: 100000, budgetRefund: 0,
     pendingExpenses: 400000 }` → `actualNet: 1000000`, `realBalance: 1100000`, `available: 700000`,
     `potentialSavings: -100000`.
   - **No refunds** (regression parity with B1): `actualRefund: 0`, `budgetRefund: 0` →
     `realBalance === actualNet`, `available === actualNet − pendingExpenses`, `potentialSavings: 0`.
   - **`available` goes negative** (Faltante, B2 parity): pending > realBalance → negative `available`.
   - **`potentialSavings` positive**: `budgetRefund > actualRefund` → positive gap (refund still to
     arrive).
   - **`actualNet` excludes refunds guard**: assert `actualNet` ignores `actualRefund` entirely.
   The suite fails to compile/run — function does not exist yet.
2. **GREEN** — implement `computeBudgetSummary.ts` (plain named export, explicit `BudgetSummary`
   return type, no default export) and add the two exports to `index.ts`. Domain suite passes.

### Cycle 2 — BudgetTab integration

3. **RED** — rewrite B3 (`BudgetTab.test.tsx:292`) assertions to the corrected behavior. Fixture is
   unchanged (`initialBudget={{ Arriendo: 400000 }}`, transactions `[Peter +1000000 income,
   Isapre +100000 refund]`). Replace the single old assertion `within(netoCard).getByText("Ahorro
   potencial $700.000")` with the two new ones:
   ```ts
   expect(within(netoCard).getByText("Disponible $700.000")).toBeTruthy();
   expect(within(netoCard).getByText("Ahorro potencial $100.000")).toBeTruthy();
   ```
   (Update the `// B3 —` comment to describe the corrected split.) Against the still-inline old math
   this now fails (old code renders `Disponible $600.000` + `Ahorro potencial $600.000`).
4. **GREEN** — apply the `BudgetTab.tsx` integration edit above. B3 passes; full suite green
   (`npm run test`).

### Cycle 3 — Phase 4 (v3): Neto "Real" = realBalance

5. **RED** — add to B3 (`BudgetTab.test.tsx:294`) the assertion
   `expect(within(netoCard).getByText("Real $1.100.000")).toBeTruthy();`. Against the current code
   (which still feeds `actual={actualNet}` = 1000000) this fails, rendering "Real $1.000.000".
6. **GREEN** — in `BudgetTab.tsx`, destructure `realBalance` and change the Neto card to
   `actual={realBalance}`. B3 passes; full suite green. T4 stays green untouched (its "Real" line is
   `$0` and its `$400.000` is Presup).

### Regression guards (must stay green untouched)

- **T4** (`:138`, "Neto excludes refunds → $400.000") — `actualNet` formula is unchanged; `$400.000`
  is the Neto **Presup.** figure and stays unique in the card. Protected.
- **B1** (`:260`, "Disponible $600.000") and **B2** (`:276`, "Faltante $400.000") — no refund group,
  so `actualRefund = 0` and `realBalance === actualNet`; `available` is byte-identical.
- **B4/B5** (`:313`, `:330`) — absence assertions on Ingresos/Gastos cards; those props are never
  passed. Unaffected.
- **A1–A7** (`SummaryCard` unit tests) — prop names and Spanish labels preserved; the
  `ahorroPotencial` prop name is deliberately kept. Green verbatim.
- **`budgetRefund` other consumers** — Devoluciones SummaryCard "Presup." (line 136) and
  `BudgetTableView`/`BudgetCardsView` still read `budgetRefund`/`budget` directly; untouched.

## Migration / Rollout

No data/schema/KV migration. Pure refactor + one intended behavior change. Single PR. Rollback:
delete `computeBudgetSummary.{ts,test.ts}`, remove the two `index.ts` exports, restore the inline
lines 87–89 and the `ahorroPotencial={ahorroPotencial}` prop, and restore the original B3 assertion.

## Review Workload Forecast

| Item | Est. changed lines |
|------|--------------------|
| `computeBudgetSummary.ts` (new) | ~18 |
| `computeBudgetSummary.test.ts` (new) | ~50 |
| `index.ts` (2 export lines) | ~2 |
| `BudgetTab.tsx` (import + 3→7 line swap + 1 prop value) | ~8 |
| `BudgetTab.test.tsx` (B3 rewrite) | ~4 |
| **Total** | **~80** |

Well under the 400-line budget. `delivery_strategy` is `ask-on-risk`, but this is clearly
low-risk/low-line-count (~80 lines, one new pure function, one intended test change, no schema/data
surface). **Recommendation: single PR, no chaining. No user decision needed** — the size guard does
not trip.

## Resolved Decisions

- **Function shape**: object parameter, five named `number` fields (deviation from sibling positional
  style, justified by arg count + type ambiguity; pre-approved in proposal).
- **`SummaryCard` prop**: keep `ahorroPotencial` prop name, feed `potentialSavings` value — confines
  the change and keeps A4/A5 green.
- **Return breadth**: full `BudgetSummary` (five fields); component destructures three.
- **Barrel export**: both `computeBudgetSummary` and `BudgetSummary` type added to
  `features/finance/domain/index.ts`, matching how siblings are re-exported.

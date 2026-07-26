# Proposal: Month label + month navigation in the finance-v2 Movimientos tab

## Intent

The Movimientos tab shows a transaction list, a summary and a cross-month-save banner, but **never
says which month it is showing**, and offers **no way to change it**. `viewedMonth` is a static
server-computed prop (`currentMonth()`) that nothing mutates — so the user is permanently pinned to
the current month with no on-screen confirmation of that fact. Reviewing last month's spending, or
checking a transaction they deliberately saved into next month via the destination-month picker,
is impossible from the UI.

**Success**: the user opens Movimientos, reads the month, steps back and forward with prev/next, and
each step loads that month's transactions, totals and day groups — with no stale banner, no stale
list, and no other tab affected.

## Scope

### In Scope

- Month label in `TransactionsTab` (via existing `formatMonth`).
- Prev/next month controls in the same tab, using existing `prevMonth`/`nextMonth`.
- `viewedMonth` becomes client state seeded from the server prop; changing it re-loads
  transactions and resets month-scoped state (`transactions`, `totals`, `dayGroups`,
  `lastCrossMonthSave`).
- New auth-gated `"use server"` loader action (e.g. `handleLoadTransactions(month)`) mirroring the
  existing action pattern in `financeV2Actions.ts`.
- Tests for the new hook behaviour (re-fetch/reset on month change), currently non-existent.

### Out of Scope

- **URL param / bookmarkability** (`?month=YYYY-MM`) — confirmed with user: client-only, no URL.
- **Tabs 1 and 2** (`IncomeSplitTab`, `BudgetTab`) — confirmed global, non-month-scoped.
- **Jump-to-arbitrary-month picker** — prev/next only in this slice; a dropdown is a possible
  follow-up. (Not the same as `TransactionForm`'s "Mes" select, which picks the *destination* month
  of a new transaction and stays as-is.)
- Navigation bounds / disabled arrows at a min or max month — unbounded stepping; unknown months
  simply load empty.
- Loading skeletons or optimistic UI beyond a minimal pending state.

## Capabilities

### New Capabilities

- `finance-v2-month-navigation`: which month the Movimientos tab displays, how it is labelled, how
  prev/next change it, and what month-scoped state must reset on change.

### Modified Capabilities

- None. No existing spec under `openspec/specs/` covers finance-v2 transactions.

## Approach

Confirmed decision from exploration — **client-side navigation via a new server action**, no URL:

1. Export `handleLoadTransactions(month)` as an auth-gated server action; `kvAdapter.loadTransactions(month)`
   is already month-parametrized, so no data-layer change is expected.
2. Hoist `viewedMonth` as `useState` in `FinanceV2Screen` (consistent with its documented design
   decision #1: all tab state hoisted to avoid remount-on-tab-switch), seeded from the page's
   `currentMonth()` prop.
3. `useFinanceV2Transactions` reacts to a changing `viewedMonth`: call the loader, replace
   month-scoped state, clear `lastCrossMonthSave`, and guard against out-of-order responses.
4. `TransactionsTab` renders label + prev/next and calls the setter.

**Mandatory before implementation**: per `AGENTS.md`, the design phase MUST verify Next 16.2.9
server-action conventions in `node_modules/next/dist/docs/` — do not implement from memory.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `features/finance-v2/data/financeV2Actions.ts` + `data/index.ts` | Modified | New auth-gated `handleLoadTransactions(month)` |
| `.../presentation/screens/Dashboard/FinanceV2Screen.tsx` | Modified | `viewedMonth` becomes hoisted state |
| `.../presentation/hooks/useFinanceV2Transactions.ts` | Modified | Re-fetch + reset month-scoped state on month change |
| `.../presentation/components/Transactions/TransactionsTab.tsx` | Modified | Month label + prev/next controls |
| `.../components/Transactions/TransactionForm.tsx` | Unchanged (regression-check) | Destination-month options derive from `viewedMonth` |
| `app/finance-v2/page.tsx` | Unchanged | Still seeds the initial month |
| `features/finance-v2/data/kvAdapter.ts` | Unchanged | Already month-parametrized |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale-closure / out-of-order race between a pending save and a month switch | Med | Design must define a request-token or ref guard; the existing `persist`/`listRef` pattern has never faced a changing month |
| Stale "Guardado en {other month}" banner survives a month switch | Med | Reset `lastCrossMonthSave` in the same state transition as the month change; assert in tests |
| `TransactionForm` destination options shift while the Add modal is open | Med | Confirmed with user: disable month nav while the Add modal is open |
| No existing test exercises a changing `viewedMonth` | High | New hook + tab tests are in-scope deliverables, not optional |
| Next 16.2.9 server-action API differs from training data | Med | `AGENTS.md` gate: read `node_modules/next/dist/docs/` in design before writing code |
| Rapid prev/next clicking floods the loader | Low | Ignore superseded responses via the same guard as the race above |

## Confirmed Product Decisions

- **Modal-open behaviour**: disable month nav while the Add-Transaction modal is open — smaller,
  more predictable, avoids the user submitting into a month they no longer believe they are in.
- **Navigation bounds**: unbounded — prev/next always work; a month with no transactions renders
  the existing empty-list state.
- **Empty months**: no new empty state — reuse the current list-empty rendering.

## Rollback Plan

Purely additive. To revert: delete the label + prev/next controls from `TransactionsTab.tsx`, revert
`viewedMonth` in `FinanceV2Screen.tsx` to a plain prop, drop the re-fetch effect in
`useFinanceV2Transactions.ts`, and remove `handleLoadTransactions` from `financeV2Actions.ts` /
`data/index.ts`. No KV schema, key format or stored data changes, so no migration and no data
rewrite. Any month keys already written by a cross-month save remain valid and readable.

## First-Slice Boundary

Everything above is one slice: no data-layer change, one new action, one new piece of state, one UI
control cluster. If the forecast at task time exceeds the review budget, split at
`handleLoadTransactions` + hook re-fetch/reset (+ tests) as slice 1, and the `TransactionsTab` label
+ prev/next UI as slice 2.

## Success Criteria

- [ ] The Movimientos tab always displays the month currently being viewed.
- [ ] Prev/next load that month's transactions, totals and day groups without a full page reload.
- [ ] `lastCrossMonthSave` never shows a banner from a previously viewed month.
- [ ] `IncomeSplitTab` and `BudgetTab` behaviour is byte-for-byte unchanged.
- [ ] New tests cover: month change re-fetch, month-scoped state reset, out-of-order response guard.
- [ ] Full suite green (`npm run test`) and `npm run build` passes.

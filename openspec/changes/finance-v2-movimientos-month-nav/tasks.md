# Tasks: Month label + month navigation in the finance-v2 Movimientos tab

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~420-450 total (over budget as one PR) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (action + hook re-fetch/reset/guards + screen/page wiring, ~264 lines) → PR 2 (MonthNav + TransactionsTab UI + AddTransactionModal remount, ~172 lines) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

Breakdown: `financeV2Actions.ts` (~10), `data/index.ts` (~5), `transactionDate.ts` comment (~3),
`useFinanceV2Transactions.ts` (~45 — 2 refs, `isLoadingMonth`, the re-fetch/reset effect, the
`persist`/`addTransaction` routing fix to `loadedMonthRef`), `FinanceV2Screen.tsx` (~10 for the
`initialMonth`/`onLoadTransactions` slice-1 portion), `app/finance-v2/page.tsx` (~6) — Phase 1-3
prod total ~79 lines. Tests for that layer are the heavy part: `useFinanceV2Transactions.test.ts`
(~140 — 6 new cases per the design's Testing Strategy table, several needing manually-controlled
deferred promises for the ordering/corruption guards), `financeV2Actions.test.ts` (~40),
`FinanceV2Screen.test.tsx` (~8, prop rename only) — Phase 1-3 test total ~188 lines. **Slice 1
(PR 1) ≈ 267 lines**, standalone-shippable and low behavioural risk (no new UI surface).

`TransactionsTab.tsx` (~12 — `MonthNav` render, `onChangeMonth`, `disabled={isFormOpen}`),
`AddTransactionModal.tsx` (~1 — `key={viewedMonth}`), `shared/components/MonthNav/MonthNav.tsx`
(~6 — optional `disabled` prop), `FinanceV2Screen.tsx` (~5 remaining — wire `setViewedMonth` into
`onChangeMonth`) — Phase 4 prod total ~24 lines. `MonthNav.test.tsx` (~45, new file),
`TransactionsTab.test.tsx` (~100 — 4-5 new cases plus a prop-signature update to ~7 existing
renders) — Phase 4 test total ~145 lines. **Slice 2 (PR 2) ≈ 169 lines.**

Combined single-PR estimate (~436 lines) sits well above the 400-line guard, so it is marked
**High** and split at the exact boundary the proposal's own "First-Slice Boundary" section names:
`handleLoadTransactions` + hook re-fetch/reset (+ tests) as slice 1, `TransactionsTab` label +
prev/next UI (+ tests) as slice 2. This is the natural seam anyway — PR 2 depends on PR 1's
`onLoad` param and `loadedMonthRef`/`requestIdRef` guards, not vice versa.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | `handleLoadTransactions` action + `useFinanceV2Transactions` re-fetch/reset/ordering/corruption guards + `FinanceV2Screen`/`page.tsx` wiring (viewedMonth hoisted but not yet UI-reachable) | PR 1 | Base branch TBD by chain strategy; tests included; ~267 lines; leaves one intentional `no-unused-vars` ESLint warning on `setViewedMonth` until PR 2, same pattern as the `expense-unit-multiplier` precedent |
| 2 | `MonthNav` `disabled` prop + `TransactionsTab` label/prev/next + `AddTransactionModal` `key` remount fix, wiring `setViewedMonth` into `onChangeMonth` | PR 2 | Depends on PR 1's `onLoad` param and hook guards; resolves PR 1's deferred ESLint warning; ~169 lines |

## Phase 1: Server action — `handleLoadTransactions`

_Spec: "A month change re-fetches transactions, totals, and day groups" (partial — action contract only)._

- [x] 1.1 RED: `features/finance-v2/data/financeV2Actions.test.ts` — add
  `describe("handleLoadTransactions")` with 3 cases mirroring the existing cookie-mock pattern:
  returns `[]` without auth and does not call `loadTransactions`; returns `[]` for a malformed
  month (e.g. `"2026-13"`) even when authenticated; delegates to `loadTransactions(month)` and
  returns its result when authenticated and `month` is well-formed. Extend the `vi.mock("./kvAdapter")`
  hoisted mocks with a `loadTransactionsMock`. Must fail — `handleLoadTransactions` does not exist.
- [x] 1.2 GREEN: `features/finance-v2/data/financeV2Actions.ts` — import `loadTransactions` from
  `./kvAdapter`; implement `handleLoadTransactions(month: string): Promise<FinanceV2Transaction[]>`
  per the design's contract: cookie auth-gate → `isTransactionMonth(month)` guard → delegate to
  `loadTransactions(month)`; both denial paths return `[]`. Suite (1.1) passes.
- [x] 1.3 GREEN: `features/finance-v2/data/index.ts` — export `handleLoadTransactions` alongside the
  other auth-gated actions; correct the now-false barrel comment ("there is no separate auth-gated
  read action for any of them") to name `handleLoadTransactions` as the exception, per design.
- [x] 1.4 GREEN: `features/finance-v2/domain/transactionDate.ts` — update `isTransactionMonth`'s
  doc comment from "the ONE place ... (`appendTransactionToMonth`)" to name both call sites:
  `appendTransactionToMonth` and `handleLoadTransactions`.

## Phase 2: Hook — re-fetch effect, ordering guard, corruption guard (strict TDD)

_Spec: "re-fetches transactions/totals/dayGroups", "clears the cross-month-save banner",
"superseded loader responses MUST NOT overwrite newer state"._

- [x] 2.1 RED: `features/finance-v2/presentation/hooks/useFinanceV2Transactions.test.ts` — update the
  shared `renderHook` setup to pass an `onLoad` mock (default `vi.fn().mockResolvedValue([])`) to
  every existing call, then add:
  - "re-fetches and replaces `transactions`/`totals`/`dayGroups` when `viewedMonth` changes" —
    `rerender({ viewedMonth: "2026-08" })` with `onLoad` returning a different list for `"2026-08"`.
  - "clears `lastCrossMonthSave` synchronously when `viewedMonth` changes, before `onLoad` resolves" —
    manually-controlled deferred `onLoad`, assert the banner is gone immediately after `rerender`,
    before resolving.
  - **Ordering guard**: two deferred `onLoad` promises for `"2026-08"` then `"2026-09"`, resolved
    newest-first — assert final `transactions` match `"2026-09"`'s data, not `"2026-08"`'s.
  - **Corruption guard**: with a pending deferred load in flight, call `deleteTransaction` — assert
    `onSave`'s first argument is the *previously loaded* month (`loadedMonthRef`), not the new
    `viewedMonth` being awaited.
  - **Cross-month add during a pending load**: with a pending deferred load in flight, add a
    transaction whose `month` differs from the loaded month — assert it still routes through
    `onSaveToOtherMonth`, not into the in-memory list.
  - "a rejected `onLoad` applies an empty list and does not leave the previous month's data
    rendered" — `onLoad.mockRejectedValueOnce(...)`.
  Must fail — the hook does not accept `onLoad`, has no re-fetch effect, and `persist`/`addTransaction`
  still target `viewedMonth` directly.
- [x] 2.2 GREEN: `features/finance-v2/presentation/hooks/useFinanceV2Transactions.ts` — add `onLoad`
  to `Params`; add `loadedMonthRef` (seeded from the initial `viewedMonth`), `requestIdRef` (`useRef(0)`),
  and `isLoadingMonth` (`useState(false)`); add the re-fetch effect exactly per the design's snippet
  (clear `lastCrossMonthSave` and bump `requestIdRef` synchronously at effect start; `apply()` checks
  `requestId === requestIdRef.current` before writing `loadedMonthRef`/`listRef`/`transactions`;
  rejection applies `[]` via the same `apply` path); change `persist`'s `onSave` call target from
  `viewedMonth` to `loadedMonthRef.current`; change `addTransaction`'s routing condition from
  `tx.month === viewedMonth` to `tx.month === loadedMonthRef.current`. All 6 new + 9 existing tests
  green.

## Phase 3: Screen + page wiring (slice 1 completion — compiles without new UI controls)

_Spec: "The Movimientos tab always displays the currently viewed month" (state plumbing only;
no visible control yet — that is Phase 4)._

- [x] 3.1 `features/finance-v2/presentation/screens/Dashboard/FinanceV2Screen.tsx` — rename the
  `viewedMonth` prop to `initialMonth`; add `onLoadTransactions: (month: string) => Promise<FinanceV2Transaction[]>`
  to `Props`; hoist `viewedMonth`/`setViewedMonth` via `useState(initialMonth)`; pass
  `onLoad: onLoadTransactions` into `useFinanceV2Transactions`. `setViewedMonth` is intentionally
  unused until Phase 4 (matches the `expense-unit-multiplier` precedent for a deferred prop —
  expect a `no-unused-vars` ESLint warning, not an error, until 4.7 resolves it).
- [x] 3.2 `app/finance-v2/page.tsx` — import `handleLoadTransactions` from `@/features/finance-v2/data`;
  rename the `viewedMonth={month}` prop passed to `<FinanceV2Screen>` to `initialMonth={month}`; add
  `onLoadTransactions={handleLoadTransactions}`.
- [x] 3.3 `features/finance-v2/presentation/screens/Dashboard/FinanceV2Screen.test.tsx` — update
  `defaultProps()`: rename `viewedMonth` to `initialMonth`, add
  `onLoadTransactions: vi.fn().mockResolvedValue([])`. Full existing suite stays green (no new
  assertions needed — the design's Testing Strategy table has no separate screen-level nav case;
  that behaviour is covered by the hook tests in Phase 2 and the component tests in Phase 4).
- [x] 3.4 Run `npm run test` and `tsc --noEmit` — full suite green; confirm the only new diagnostic
  is the expected `no-unused-vars` warning on `setViewedMonth` from 3.1.

## Phase 4: UI — `MonthNav`, `TransactionsTab`, `AddTransactionModal` remount (strict TDD)

_Spec: "Prev/next controls change viewedMonth without bounds", "Month navigation is disabled while
the Add-Transaction modal is open"._

- [x] 4.1 RED: `shared/components/MonthNav/MonthNav.test.tsx` (new file) — cases: renders `label`;
  clicking the prev/next buttons calls `onPrev`/`onNext`; `disabled={true}` disables both buttons
  (assert the `disabled` DOM attribute); omitting `disabled` (v1's existing call site) leaves both
  buttons enabled. Must fail — `disabled` prop does not exist.
- [x] 4.2 GREEN: `shared/components/MonthNav/MonthNav.tsx` — add optional `disabled?: boolean`
  (default `false`), applied to both `<button>`s plus
  `disabled:cursor-not-allowed disabled:opacity-50` classes. Suite (4.1) passes; confirm v1's
  existing `MonthNav` call site and its own test suite stay byte-for-byte green (no `disabled` prop
  passed there).
- [x] 4.3 RED: `features/finance-v2/presentation/components/Transactions/TransactionsTab.test.tsx` —
  add `onChangeMonth: vi.fn()` to every existing render call's props, then add cases: the month
  label renders `formatMonth(viewedMonth)`; clicking "Anterior"/"Siguiente" calls `onChangeMonth`
  with `prevMonth(viewedMonth)`/`nextMonth(viewedMonth)` respectively; prev/next become disabled
  once the Add-Transaction modal is open (open the modal via the existing "Nuevo movimiento" button,
  then assert both `MonthNav` buttons are disabled). Must fail — `TransactionsTab` does not render
  `MonthNav` or accept `onChangeMonth` yet.
- [x] 4.4 GREEN: `features/finance-v2/presentation/components/Transactions/TransactionsTab.tsx` —
  import `MonthNav` and `prevMonth`/`nextMonth` from `@/shared/utils/monthUtils` (`formatMonth` is
  already imported); add `onChangeMonth: (month: string) => void` to `Props`; render
  `<MonthNav label={formatMonth(viewedMonth)} onPrev={() => onChangeMonth(prevMonth(viewedMonth))} onNext={() => onChangeMonth(nextMonth(viewedMonth))} disabled={isFormOpen} />`
  above `MovementSummary`, per the design's UI-wiring snippet. Suite (4.3) passes.
- [x] 4.5 RED: `features/finance-v2/presentation/components/Transactions/TransactionsTab.test.tsx` —
  add "the Add-Transaction form's month select reseeds after a month change": render
  `TransactionsTab`, rerender with a new `viewedMonth`, open the Add modal, assert the "Mes" select's
  value matches the new `viewedMonth` (not the stale one from first mount). Must fail —
  `TransactionForm`'s sticky `month` state does not reseed on remount.
- [x] 4.6 GREEN: `features/finance-v2/presentation/components/Transactions/AddTransactionModal.tsx` —
  add `key={viewedMonth}` to `<TransactionForm>`, forcing a remount (and fresh `useState` seed) on
  every month change, mirroring v1's `key={budgetLoadedFor}` idiom. Suite (4.5) passes.
- [x] 4.7 `features/finance-v2/presentation/screens/Dashboard/FinanceV2Screen.tsx` — pass
  `onChangeMonth={setViewedMonth}` into `<TransactionsTab>`, consuming the `setViewedMonth` deferred
  by Phase 3 and resolving its ESLint warning.

## Phase 5: Regression check

- [ ] 5.1 Run `npm run test` — full suite green: `IncomeSplitTab`, `BudgetTab`, v1 `MonthNav`,
  `TransactionForm`, `TransactionList`/`TransactionRow`, `MovementSummary` suites unaffected (files
  untouched); all new/updated suites from Phases 1-4 passing.
- [ ] 5.2 Run `tsc --noEmit` — clean, no errors, confirming the Phase 3 warning was fully resolved
  by 4.7. Run `eslint` on changed files — 0 warnings, 0 errors.
- [ ] 5.3 Run `npm run build` — passes, per the proposal's Success Criteria.

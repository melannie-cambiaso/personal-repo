# Apply Progress — PR 2 (Phases 4-5)

**Change**: finance-v2-movimientos-month-nav
**Slice**: PR 2 of 2 (stacked-to-main) — UI layer: `MonthNav` disabled prop, `TransactionsTab`
month label/prev/next, `AddTransactionModal` remount fix
**Mode**: Strict TDD
**Base**: `main` @ `903cf01` (PR 1, already merged)
**Branch**: `finance-v2-month-nav-pr2` (local only, not pushed)

## Status

11/11 assigned tasks complete (Phase 4: 7/7, Phase 5: 3/3 — plus the 1 already-complete carry-over
note below). All of PR 1's tasks (Phases 1-3, 12/12) were already complete on `main`; this batch
covers exactly the remaining scope.

## Completed Tasks

- [x] 4.1 RED: `shared/components/MonthNav/MonthNav.test.tsx` (new file) — 5 cases: renders label,
  onPrev/onNext click handlers, disabled disables both buttons, omitting disabled leaves both enabled
- [x] 4.2 GREEN: `shared/components/MonthNav/MonthNav.tsx` — optional `disabled?: boolean` (default
  `false`), applied to both buttons + `disabled:cursor-not-allowed disabled:opacity-50`
- [x] 4.3 RED: `TransactionsTab.test.tsx` — `onChangeMonth: vi.fn()` added to all 7 existing render
  calls; 4 new cases (label, prev→onChangeMonth, next→onChangeMonth, disabled-while-modal-open)
- [x] 4.4 GREEN: `TransactionsTab.tsx` — renders shared `MonthNav` above the cross-month banner and
  `MovementSummary`, wired to `onChangeMonth`/`prevMonth`/`nextMonth`/`disabled={isFormOpen}`
- [x] 4.5 RED: `TransactionsTab.test.tsx` — "the Add-Transaction form's month select reseeds after a
  month change" (render, rerender with new `viewedMonth`, open modal, assert `Mes` select value)
- [x] 4.6 GREEN: `AddTransactionModal.tsx` — `key={viewedMonth}` on `<TransactionForm>`
- [x] 4.7 `FinanceV2Screen.tsx` — `onChangeMonth={setViewedMonth}` wired into `<TransactionsTab>`;
  resolved PR 1's intentionally-deferred `no-unused-vars` warning on `setViewedMonth`
- [x] 5.1 `npm run test` — full suite green (694/694, up from PR 1's 684/684; +10 new tests)
- [x] 5.2 `tsc --noEmit` clean; `eslint` on all 6 changed files — 0 warnings, 0 errors
- [x] 5.3 `npm run build` — passes (Turbopack, all 14 routes generated)

## Files Changed

| File | Action | What Was Done |
|------|--------|----------------|
| `shared/components/MonthNav/MonthNav.tsx` | Modified | Added optional `disabled?: boolean` (default `false`) + disabled styling on both buttons |
| `shared/components/MonthNav/MonthNav.test.tsx` | Created | 5 cases: label, onPrev, onNext, disabled=true, disabled omitted |
| `features/finance-v2/presentation/components/Transactions/TransactionsTab.tsx` | Modified | Renders `MonthNav` (label/prev/next/disabled), added `onChangeMonth` prop |
| `features/finance-v2/presentation/components/Transactions/TransactionsTab.test.tsx` | Modified | `onChangeMonth: vi.fn()` added to all render calls; 4 new cases (label, prev, next, disabled-while-modal-open) + 1 more (form reseed) |
| `features/finance-v2/presentation/components/Transactions/AddTransactionModal.tsx` | Modified | `key={viewedMonth}` on `<TransactionForm>` |
| `features/finance-v2/presentation/screens/Dashboard/FinanceV2Screen.tsx` | Modified | `onChangeMonth={setViewedMonth}` wired into `<TransactionsTab>`; comment updated (no longer "unused until PR2") |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 4.1-4.2 | `MonthNav.test.tsx` | Component (RTL) | N/A — new file | ✅ Written (1/5 fails pre-implementation: `disabled=true` case; 4 others pass trivially against the pre-existing component since they don't exercise `disabled`) | ✅ Passed (5/5) | ✅ 5 cases: label, onPrev, onNext, disabled=true, disabled omitted (v1 regression) | ➖ None needed |
| 4.3-4.4 | `TransactionsTab.test.tsx` | Component (RTL) | ✅ 8/8 pre-existing suite | ✅ Written (3/3 new nav cases fail: `TransactionsTab` doesn't render `MonthNav` or accept `onChangeMonth`) | ✅ Passed (11/11: 8 existing + 3 new) | ✅ 3 cases: label formatting, prev→prevMonth, next→nextMonth, plus disabled-while-modal-open | ➖ None needed — matches design's UI-wiring snippet exactly |
| 4.5-4.6 | `TransactionsTab.test.tsx` | Component (RTL) | ✅ 11/11 (post 4.4) | ✅ Written (fails: select shows `2026-07` instead of `2026-09` after rerender + modal open) | ✅ Passed (12/12) | ➖ Single case — sticky-state bug has one clear repro shape | ➖ None needed — mirrors v1's `key={budgetLoadedFor}` idiom verbatim |
| 4.7 | N/A (prop-wiring, covered by 4.3's `onChangeMonth` assertions at the `TransactionsTab` level) | Structural | ✅ Full `FinanceV2Screen.test.tsx` suite (untouched, still 17/17) | N/A — pure wiring, no new screen-level scenario per design's Testing Strategy table | ✅ `tsc --noEmit` confirms the prop now resolves; full suite stays green | ➖ Skipped: no new assertion needed, `setViewedMonth`'s effect is already proven by `TransactionsTab`'s own prev/next tests | ➖ None needed |

### Test Summary

- **Total tests written**: 10 (5 `MonthNav` cases + 5 `TransactionsTab` cases: label, prev, next,
  disabled-while-modal-open, form-reseed-after-month-change)
- **Total tests passing**: 694/694 (full suite, up from PR 1's 684/684)
- **Layers used**: Component (RTL) for all — no new hook/action layer in this slice
- **Pure functions created**: 0 — reuses existing `formatMonth`/`prevMonth`/`nextMonth` from
  `shared/utils/formatMonth.ts` / `shared/utils/monthUtils.ts`

## Verification Run

- `npm run test` → **694/694 passed** (90 test files, +1 new file, +10 new tests over PR 1's 684)
- `npx tsc --noEmit` → clean, no errors — confirms the Phase 3 `setViewedMonth` unused-var warning
  is now resolved (it's consumed by `onChangeMonth={setViewedMonth}`)
- `npx eslint` on all 6 changed files → 0 warnings, 0 errors
- `npm run build` → succeeded (`next build`, Turbopack, all 14 routes generated)

## Deviations from Design

None. Implementation matches design.md's UI-wiring snippet verbatim (`MonthNav` render call,
`disabled` prop signature, `key={viewedMonth}` remount idiom) and D6/D7's ADR rationale.

One clarification not spelled out in the design snippet: `MonthNav` is rendered above the
cross-month-save banner too (not only above `MovementSummary`) — i.e., at the very top of
`TransactionsTab`'s layout. The design's snippet only asserted "above `MovementSummary`"; placing it
above the banner as well satisfies that constraint and reads as the natural page-level control
position. No spec requirement is affected (the banner's own visibility/reset behavior, owned by the
hook layer, is untouched).

## Issues Found

One test-authoring gotcha, not a product issue: `screen.getByText(formatMonth("2026-07"))` initially
matched multiple elements, because `AddTransactionModal`'s `<dialog>` (and its `TransactionForm`'s
"Mes" `<select>` options) is always mounted per the design, and one of its month-window options
happens to render the same formatted text as the current month's `MonthNav` label. Fixed by scoping
the query with `{ selector: "span" }` to target `MonthNav`'s label element specifically. No
production code changed for this — purely a test query specificity fix, called out here since it's
a reusable gotcha for any future `TransactionsTab.test.tsx` case that asserts month-label text.

## Workload / PR Boundary

- Mode: chained PR slice (stacked-to-main)
- Current work unit: PR 2 of 2 — `MonthNav` disabled prop, `TransactionsTab` label + prev/next +
  disabled-while-modal-open, `AddTransactionModal` remount fix, `FinanceV2Screen` final wiring
- Boundary: starts from `main` (branch `finance-v2-month-nav-pr2`, based on PR 1's already-merged
  `903cf01`), ends at the state described above — full suite green, `tsc`/`eslint`/`build` all clean,
  no known remaining tasks in tasks.md.
- Estimated review budget impact: `git diff --stat main` → 7 files changed, 197 insertions(+),
  18 deletions(-) → **215 changed lines**, comfortably under the 400-line budget and close to the
  forecast's ~169-line estimate for this slice (delta mostly from the extra `disabled-while-modal-open`
  and `form-reseed` test cases beyond the forecast's minimum count).

## Commits (local branch `finance-v2-month-nav-pr2`, NOT pushed)

- `6c90b32` — feat(month-nav): add optional disabled prop to shared MonthNav
- `35a3930` — feat(finance-v2): render month label and prev/next nav in TransactionsTab
- `c0bc23e` — fix(finance-v2): remount TransactionForm on month change to reseed sticky month state
- `4e01958` — docs(finance-v2): mark PR2 tasks complete in tasks.md

Branch created off `main` (which already contains PR 1's 3 commits + its post-review fix commit);
per stacked-to-main chain strategy, this PR also targets `main` directly. Not pushed, not merged —
per instructions, that is the orchestrator's job after review.

## Remaining Tasks

None. All of tasks.md's Phase 1-5 items are now `[x]`. The change is implementation-complete
pending review and `sdd-verify`.

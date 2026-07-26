# Finance V2 Month Navigation Specification

## Purpose

Let the Movimientos tab (`TransactionsTab`) show which month it is displaying and let the user step
to an adjacent month with prev/next controls. `viewedMonth` becomes hoisted client state in
`FinanceV2Screen`, seeded from the server's `currentMonth()` prop, and each change re-fetches
month-scoped data through a new auth-gated server action. Scope is Movimientos only;
`IncomeSplitTab` and `BudgetTab` are unaffected.

## Requirements

### Requirement: The Movimientos tab always displays the currently viewed month

The system MUST render a human-readable label for `viewedMonth` (via the existing `formatMonth`)
in `TransactionsTab`, and MUST keep it in sync whenever `viewedMonth` changes.

#### Scenario: Initial label matches the server-seeded month

- GIVEN `FinanceV2Screen` receives `currentMonth()` as its initial `viewedMonth`
- WHEN `TransactionsTab` first renders
- THEN the label MUST show that month, formatted via `formatMonth`

### Requirement: Prev/next controls change `viewedMonth` without bounds

`TransactionsTab` MUST expose prev/next controls that call `prevMonth`/`nextMonth` and update the
hoisted `viewedMonth` state in `FinanceV2Screen`. The system MUST NOT clamp, disable, or otherwise
bound this navigation by a minimum or maximum month.

#### Scenario: Stepping back and forward changes the displayed month

- GIVEN `viewedMonth` is `2026-07`
- WHEN the user clicks "prev"
- THEN `viewedMonth` MUST become `2026-06` and the label MUST update to match

#### Scenario: Navigation to a month with no data still succeeds

- GIVEN the user navigates to a month with zero stored transactions
- WHEN that month becomes `viewedMonth`
- THEN the system MUST render the existing empty-list state, with no new empty-state variant

### Requirement: A month change re-fetches transactions, totals, and day groups

WHEN `viewedMonth` changes, the system MUST call the auth-gated `handleLoadTransactions(month)`
server action and replace `transactions`, `totals`, and `dayGroups` with the response for the new
month. No stale data from the previously viewed month MAY remain rendered.

#### Scenario: Changing month replaces all month-scoped data

- GIVEN `viewedMonth` is `2026-07` with its transactions, totals, and day groups loaded
- WHEN the user navigates to `2026-08`
- THEN `transactions`, `totals`, and `dayGroups` MUST all be replaced with `2026-08`'s data

### Requirement: A month change clears the cross-month-save banner

WHEN `viewedMonth` changes, the system MUST reset `lastCrossMonthSave` to its empty/unset value in
the same state transition, regardless of whether that banner was currently shown.

#### Scenario: Switching months hides a stale cross-month-save banner

- GIVEN `lastCrossMonthSave` shows a banner for a transaction saved into `2026-08`
- WHEN the user navigates `viewedMonth` away from `2026-08` (in either direction)
- THEN the banner MUST no longer render

### Requirement: Superseded loader responses MUST NOT overwrite newer state

WHEN multiple `handleLoadTransactions` calls are in flight because the user navigated more than
once before the first response resolved, the system MUST apply only the response matching the
current `viewedMonth` at resolution time and MUST discard responses for any month that is no
longer the current `viewedMonth`.

#### Scenario: Rapid navigation does not let an older response win

- GIVEN the user clicks "next" twice in quick succession, issuing loads for `2026-08` then `2026-09`
- WHEN the `2026-08` response resolves after the `2026-09` response
- THEN the displayed state MUST remain `2026-09`'s data, and the `2026-08` response MUST be discarded

### Requirement: Month navigation is disabled while the Add-Transaction modal is open

WHILE the Add-Transaction modal is open, the system MUST disable both prev and next controls in
`TransactionsTab`, preventing `viewedMonth` from changing until the modal closes.

#### Scenario: Opening the Add modal disables prev/next

- GIVEN the Add-Transaction modal is closed and prev/next are enabled
- WHEN the user opens the Add-Transaction modal
- THEN prev/next MUST become disabled until the modal is closed

## Non-Goals

- No URL param or bookmarkable month (`?month=YYYY-MM`) — client-side state only.
- No changes to `IncomeSplitTab` or `BudgetTab` — both remain global, non-month-scoped.
- No jump-to-arbitrary-month picker — prev/next only in this slice.
- No new empty-state UI for months with no transactions — reuses the existing empty-list rendering.

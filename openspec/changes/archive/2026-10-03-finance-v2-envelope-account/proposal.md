# Proposal: Envelope account ("Servicios") for finance-v2

## Intent

When the user gets paid, they move a fixed chunk of money to a separate bank account used ONLY to
pay basic services (the budget category "Cuentas": Agua, Gas, Internet, Luz, Planes). finance-v2
cannot represent this today:

- There is no "transfer between my own accounts" movement — only `income`, `expense`, `savings`.
- Recording the transfer as an expense is impossible ("Cuentas" is a parent, not a leaf) and would
  double-count once each bill is paid.
- Nothing tells the user how much is left in the services account, or reminds them that this
  month's transfer has not happened yet. The user explicitly relies on the app for this because
  they do not reliably remember (transfer happens once a month, on payday).

This is a personal app, not a product: the design deliberately targets exactly this one case
(one envelope, one bound category, one direction) and avoids a general multi-account model.

**Success**: on payday the user records one "Transferencia", sees the Servicios balance go up and
the main balance go down; each bill paid afterwards lowers Servicios (not the main balance) and
still counts against its budget leaf; leftovers carry over to next month; and if a month has no
transfer yet, the Movimientos tab says so and suggests the amount.

## Scope

### In Scope

- **Envelope config** (single, global, optional): name, bound top-level budget category, opening
  balance, opening month. Editable from the Movimientos tab.
- New transaction type **`transfer`** (Principal → envelope). Amount, date, month, note. Not an
  expense, not savings. Offered in the form only when an envelope is configured.
- **Expense funding snapshot**: an expense whose category is a subcategory (or the leaf itself) of
  the bound category is stamped `paidFrom: "envelope"` at creation — same snapshot philosophy as
  `category.name`.
- **Main-account totals**: `balance = income − mainExpense − savings − transfer`, where
  `mainExpense` excludes envelope-paid expenses.
- **Envelope card** in Movimientos: carried-in balance, transferred this month, paid this month,
  balance at the end of the viewed month. Negative balance rendered as a warning, never blocked.
- **Missing-transfer reminder**: viewed month ≥ opening month and no `transfer` in it → reminder
  with suggested amount = monthly budget of the bound category (`toCategoryView(...).total`).
- Cumulative balance derived from transactions (opening balance + every month from opening month
  up to the viewed month), never stored.

### Out of Scope (confirmed with user)

- Savings / investments held in the same physical bank account — already tracked in
  `features/savings`; not duplicated here.
- Paying a bound-category bill from the main account — user confirmed it never happens.
- More than one envelope, or a generic "accounts" model.
- Transfers back from the envelope to Principal, or partial/other directions.
- Retroactive stamping of expenses recorded before the envelope was configured (the opening
  balance already reflects them).
- Budget tab and Analysis tab: unchanged. Envelope-paid expenses keep counting against their
  budget leaf exactly as today — the envelope is a funding mechanism, not a budget change.

## Capabilities

### New Capabilities

- `finance-v2-envelope-account`: envelope config, `transfer` movement, funding stamp, main vs
  envelope totals, cumulative envelope balance, missing-transfer reminder.

### Modified Capabilities

- None under `openspec/specs/` (finance-v2 transactions have no spec yet; `finance-v2-month-navigation`
  is untouched, but its re-fetch-on-month-change behaviour is extended to the carried-in balance).

## Approach

1. Domain: `transfer` variant, optional `paidFrom` on expense, `EnvelopeConfig` type, pure
   `computeEnvelopeFlows` / `computeCarriedBalance`, updated `computeTransactionTotals`.
2. Data: `finance-v2-envelope-config` key (same pattern as budget config) and a
   `loadEnvelopeCarriedBalance(month)` that `mget`s every month key from the opening month up to
   (excluding) the viewed month.
3. Actions: auth-gated `handleSaveEnvelopeConfig`, `handleLoadEnvelopeCarriedBalance`.
4. UI: form option + auto-stamp, `EnvelopeCard` (+ config modal) + reminder in `TransactionsTab`.

## Affected Areas

| Area | Impact |
|------|--------|
| `domain/FinanceV2Transaction.ts` | `transfer` variant, `paidFrom?` on expense |
| `domain/EnvelopeConfig.ts` (new), `domain/envelope.ts` (new) | Config type + pure balance/flow math |
| `domain/transactionTotals.ts` | New `transfer` total, main-only expense, new balance formula |
| `domain/spendRollup.ts` | `spendLeafRef` gets `transfer → null` (compile-forced) |
| `data/kvAdapter.ts`, `data/financeV2Actions.ts`, `data/index.ts` | Config load/save, carried balance |
| `app/finance-v2/page.tsx`, `FinanceV2Screen.tsx` | Load + thread envelope config/actions |
| `hooks/useFinanceV2Envelope.ts` (new) | Config state, carried balance fetch per month |
| `Transactions/*` (form, labels, row, summary, tab) + `Envelope/*` (new) | UI |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Carried balance stale after a cross-month save into an earlier month | Med | Re-fetch carried balance after `onSaveToOtherMonth` when target month < viewed month |
| Bound category deleted / renamed | Low | Stamp is a snapshot; missing bound category shows a "reconfigure" hint, flows stay valid |
| Many months to scan in the long run | Low | One `mget`; personal app, ~12 keys/year |
| `MovementSummary` "Gastos" now excludes envelope bills — could confuse | Med | Envelope card shows "Pagado" for the month next to it; labels make the split explicit |
| No runtime validation of persisted transactions | Low (pre-existing) | Old clients never write `transfer`; exhaustive switches stay compile-checked |

## Confirmed Product Decisions

- **"Gastos" in the Movimientos summary is main-account only.** Envelope-paid bills are shown on
  the envelope card instead. Rationale (user): basic services are non-discretionary and already
  reserved on payday, so the monthly "Gastos" figure should reflect only spending the user can
  actually control.
- Bound-category bills are ALWAYS paid from the envelope; no per-expense account picker.
- Savings in the same physical bank account stay in `features/savings`.

## Rollback Plan

Additive. Revert the code; stored `transfer` transactions would then hit the pre-existing
`computeTransactionTotals` accumulator with an unknown key — so rollback MUST also either delete
`transfer` records or keep a defensive `default` in totals. The config key
`finance-v2-envelope-config` can be deleted safely. `paidFrom` on expenses is ignored by old code.

## Success Criteria

- [ ] A `transfer` lowers the main balance and raises the envelope balance by the same amount.
- [ ] An expense in a bound subcategory lowers the envelope balance, not the main balance, and still
      counts in Budget/Analysis.
- [ ] Envelope balance carries across months and is correct after edits/deletes in any month.
- [ ] Reminder appears iff the viewed month (≥ opening month) has no transfer, with the bound
      category's monthly budget as suggestion.
- [ ] `npm run test` and `npm run build` pass.

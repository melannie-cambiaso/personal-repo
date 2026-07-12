# Proposal: Unit-based budget entries (unit amount × quantity × factor)

## Intent

Some planned-budget categories are naturally expressed as a **recurring unit cost**, not a single
flat figure. Example (user's shorthand for the DBT therapy category): a session costs a unit amount,
happens a certain number of times in the month (e.g. "5 Tuesdays this month"), and may be discounted
by a factor (e.g. 90% coverage). Today `BudgetTab` offers only ONE flat number per category, so the
user has to compute the total in their head every month and re-derive it from scratch when it
changes. This change lets a category's budget be **defined and re-edited as its parts** (unit amount,
quantity, factor), while the rest of finance keeps consuming a single derived total.

**Success**: the user opens a category in unit mode, edits the parts, sees the computed total, closes
and reopens next month, and the parts are still there to adjust — no downstream card, summary, or
export breaks.

## Scope

### In Scope
- **Planned Budget only** — `BudgetTab.tsx` (`GroupSection`/`CardsSection`) budget input and its
  persistence path (`kvAdapter.ts` `budget`, `financeActions.ts`).
- Per-category **unit mode** with 3 structured numeric fields: `unitAmount`, `quantity` (default 1,
  always manually entered — see below), `factor` (default 1, e.g. 90% → 0.9).
- Formula: `total = unitAmount × quantity × factor`.
- Persist the full breakdown per category per month so it is editable on reopen; keep
  `budget[category]` as the derived flat total for existing consumers.

### Out of Scope
- **Real transaction entry** (`AddTransactionModal.tsx`, `FinanceTransaction`) — untouched.
- **No free-text shorthand parser** — the `"DBT 55k 1 90%"` notation is only how the user *described*
  the values; every input in this app is structured. We build structured fields, not a tokenizer.
  Confirmed with the user.
- **No automatic "weeks/days in month" calculation.** `quantity` represents things like "how many
  Tuesdays this month" or "how many Thursdays this month" depending on which weekday the recurring
  expense actually falls on. The app has no record of which weekday a category's occurrences follow,
  so it cannot compute this reliably — `quantity` is **always a plain manual number the user types
  in**, exactly like `unitAmount` and `factor`. No calendar utility, no auto-fill toggle, no
  `getWeeksInMonth` function. Confirmed with the user — this was explicitly ruled out after an
  earlier draft of this proposal.
- No change to `computeBudgetSummary.ts`, `computePendingExpenses.ts`, `buildBudgetExportRows.ts`
  logic — they keep reading the derived flat number.

## Capabilities

### New Capabilities
- `finance-budget-unit-mode`: per-category unit-based budget definition (unit amount, quantity,
  factor — all manually entered), its persisted breakdown, and the derived total.

### Modified Capabilities
- None. (Existing budget consumers keep reading `budget[category]` as a plain number; no spec-level
  requirement of `finance-budget-summary` changes.)

## Approach

Confirmed **Approach 2 — persisted unit config** from exploration.

1. **New KV key alongside the flat map** (illustrative shape; design phase owns the final schema):

   ```ts
   // key: finance-budget-unit-config:{month}
   type UnitConfig = {
     unitAmount: number;
     quantity: number;      // default 1, always manual
     factor: number;        // default 1  (90% => 0.9)
   };
   type BudgetUnitConfig = Record<string /*category*/, UnitConfig>;
   ```

   `budget[category]` (existing `Record<string, number>`) continues to hold the **derived total**,
   recomputed on save. Categories without unit mode have no entry in the new map and behave exactly
   as today. This keeps the three downstream consumers untouched.

2. **UI** (illustrative): a per-category **unit-mode toggle** (per-category, not global); when ON,
   the single flat input is replaced by 3 small structured fields — Unit amount, Quantity, Factor —
   all manually editable, mirroring the existing `BudgetTab` numeric-input pattern. The computed total
   is shown read-only and written to `budget[category]` on blur.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `features/finance/data/kvAdapter.ts` | Modified | New `finance-budget-unit-config:{month}` key + load/save |
| `features/finance/data/financeActions.ts` | Modified | Server-action wrappers for the new config |
| `features/finance/presentation/components/Budget/BudgetTab.tsx` | Modified | Unit-mode toggle + 3 structured fields + compute-on-blur |
| `computeBudgetSummary.ts` / `computePendingExpenses.ts` / `buildBudgetExportRows.ts` | Unchanged | Keep reading derived `budget[category]` number |

## Backward Compatibility

Months that already have flat-only `budget` data have **no** entry in the new config map. Those
categories render as plain flat inputs (today's behavior); unit mode is opt-in and additive. No
migration of existing data is required. The existing "Copiar desde" copy-from-month flow should be
noted for design: copying should carry the unit config too (including `quantity`, which the user will
likely need to re-check/edit for the new month since occurrence counts change), or fall back to
copying the flat total.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Derived total and stored config drift out of sync | Med | Single write path: recompute total from config on every save |
| User forgets to update `quantity` when the month changes (e.g. still has last month's Tuesday count) | Med | No mitigation beyond UX — it's an inherent tradeoff of "always manual"; documented as expected behavior, not a bug |
| "Copiar desde" copies flat total but not unit config | Low | Extend copy path or document the fallback in design |

## Rollback Plan

Fully additive and reversible. To revert: remove the unit-mode toggle/fields from `BudgetTab.tsx` and
the `finance-budget-unit-config` load/save from `kvAdapter.ts` / `financeActions.ts`. The flat
`finance-budget:{month}` values already written stay valid and every downstream consumer keeps
working, because they always read the derived flat total. Orphaned
`finance-budget-unit-config:{month}` keys are inert and can be left in place or deleted; no schema
migration or data rewrite is involved.

## Resolved Decisions (confirmed with user, no longer open)

1. **Unit mode granularity**: per category, not global. Confirmed.
2. **Free-text entry**: not wanted — structured fields only (`"DBT 55k 1 90%"` was descriptive
   shorthand for unitAmount/quantity/factor, not a requested text-parser input). Confirmed.
3. **`quantity` is always manual, never auto-computed**: an earlier draft proposed a
   `getWeeksInMonth` utility to auto-fill `quantity`. The user corrected this — `quantity` represents
   occurrences of a *specific weekday* (e.g. "Tuesdays this month"), which the app has no way to know
   automatically, so it must stay a plain editable number like the other two fields. No calendar
   utility is built. Confirmed.

## Success Criteria

- [ ] A category can be switched to unit mode and store `unitAmount`, `quantity`, `factor`; the
      derived total lands in `budget[category]`.
- [ ] Reopening the category next month shows the saved parts, editable, not just the flat total.
- [ ] Non-unit categories and existing flat-only months are unchanged.
- [ ] `computeBudgetSummary` / `computePendingExpenses` / export produce identical results for a
      given derived total; full suite green (`npm run test`).

# Tasks: Envelope account ("Servicios") for finance-v2

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900-1000 total (≈ 350 prod, ≈ 600 tests) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 domain → PR 2 data/actions/hooks → PR 3 UI |
| Delivery strategy | single branch, one commit per phase (user-confirmed) |
| Chain strategy | single branch, one commit per phase (user-confirmed) |

Decision needed before apply: No

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain: `transfer`, `paidFrom`, `EnvelopeConfig`, `envelope.ts`, totals, `spendLeafRef`, label map | PR 1 (~300) | Compiles and ships alone; no UI entry point yet |
| 2 | kvAdapter + actions + `useFinanceV2Envelope` + stamp in `useFinanceV2Transactions` + page/screen wiring | PR 2 (~330) | Depends on PR 1 |
| 3 | EnvelopeCard, Reminder, ConfigModal, form/row/summary/tab changes | PR 3 (~350) | Depends on PR 2; feature becomes reachable here |

## Phase 1: Domain (PR 1)

- [x] 1.1 RED/GREEN: `FinanceV2Transaction.ts` — add `transfer` variant and `paidFrom?: "envelope"`
  on expense; `spendLeafRef` `case "transfer": return null` + test that a transfer contributes to no
  leaf and no bucket, and that an envelope-paid expense still counts on its leaf.
- [x] 1.2 RED/GREEN: `transactionTotals.ts` — `transfer` sum, main-only `expense`, new `balance`;
  tests from the spec scenario (1000000/116000/43000/20000 → 864000) plus legacy expense without
  `paidFrom`.
- [x] 1.3 RED/GREEN: `EnvelopeConfig.ts` + `envelope.ts` — `computeEnvelopeFlows`, `monthsFromTo`,
  `resolvePaidFrom`, `suggestedTransfer` with the cases in design's testing table. Export from
  `domain/index.ts`.
- [x] 1.4 `transactionLabels.ts` — `transfer: "Transferencia"` in labels (compile-forced);
  update any label snapshot tests. NOT added to `TRANSACTION_TYPE_ORDER` (not compile-forced):
  the form must not offer it until 3.4 gates it on `hasEnvelope`.
- [x] 1.5 `npm run test` + `npx tsc --noEmit` green.

## Phase 2: Data, actions, hooks (PR 2)

- [x] 2.1 Re-read `use-server.md` (AGENTS.md gate); note any deprecation. No deprecation notice
  (nor in the linked `data-security.md` "Mutating Data" section); guidance unchanged: auth
  inside every action, validate inputs, return only what the UI needs.
- [x] 2.2 RED/GREEN: `kvAdapter.ts` — `loadEnvelopeConfig` / `saveEnvelopeConfig` /
  `loadTransactionsForMonths` (mget, backfill, error → []; empty `months` → [] without redis).
- [x] 2.3 RED/GREEN: `financeV2Actions.ts` — `handleSaveEnvelopeConfig`,
  `handleLoadEnvelopeCarriedBalance` (auth, month validation, null before opening, opening month
  short-circuit, carried math). Export via `data/index.ts`; fix its barrel comment. The math
  lives in the non-action server helper `data/envelopeCarriedBalance.ts`
  (`loadEnvelopeCarriedBalance(config, month)`), shared by the action and the RSC page.
- [x] 2.4 RED/GREEN: `useFinanceV2Envelope.ts` — config state + save, `carriedIn` fetch per
  `viewedMonth` with request-token guard, `refreshCarried()`, render-derived `isLoadingCarried`.
  Seeded with a server-loaded `initialCarriedIn` (no client fetch on first render); every
  carried load waits for the latest config save to land.
- [x] 2.5 RED/GREEN: `useFinanceV2Transactions.ts` — accept a `resolvePaidFrom(categoryId)`
  callback (the screen binds config + live budget) and stamp expenses in `addTransaction`;
  optional `onCrossMonthSaved` after append resolves.
- [x] 2.6 `page.tsx` + `FinanceV2Screen.tsx` — load config in the parallel `Promise.all` (then
  the initial carried-in balance), thread actions, wire cross-month refresh for earlier months
  only. Update screen tests.
- [x] 2.7 `npm run test` green.

## Phase 3: UI (PR 3)

- [ ] 3.1 RED/GREEN: `EnvelopeCard.tsx` — four figures, negative warning, hidden when loading/null.
- [ ] 3.2 RED/GREEN: `EnvelopeReminder.tsx` — visibility rule, suggested amount, missing-category text.
- [ ] 3.3 RED/GREEN: `EnvelopeConfigModal.tsx` — top-level category select, opening balance,
  `openingMonth` set only on creation.
- [ ] 3.4 RED/GREEN: `TransactionForm.tsx` — transfer option gated by `hasEnvelope`, submit branch.
- [ ] 3.5 RED/GREEN: `TransactionRow.tsx` + `MovementSummary.tsx` — transfer/envelope labels,
  "Transferencias" line.
- [ ] 3.6 `TransactionsTab.tsx` — compose card, reminder, config entry point; tab tests.
- [ ] 3.7 `npm run test` + `npm run build` green; manual check with the spec scenarios.

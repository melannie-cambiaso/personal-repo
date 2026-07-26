# Exploration: finance-v2 Movimientos tab — month label + month navigation

## Current State

`viewedMonth` is a **plain server-computed string**, not client state:
- `app/finance-v2/page.tsx` (RSC) calls `currentMonth()` (`shared/utils/monthUtils.ts`) once per request and passes it as a static prop through `FinanceV2Screen` → `useFinanceV2Transactions` → `TransactionsTab`.
- `useFinanceV2Transactions` (`features/finance-v2/presentation/hooks/useFinanceV2Transactions.ts`) uses `viewedMonth` only to (a) decide whether a new transaction's own `month` matches the currently-loaded list, routing the save accordingly, and (b) as the save-target key. Nothing ever mutates `viewedMonth` — there is no `setViewedMonth` anywhere.
- `TransactionsTab.tsx` renders `MovementSummary` + `TransactionList` + a dismissible cross-month-save banner. There is no month label and no prev/next navigation control anywhere in this tab or in `FinanceV2Screen.tsx`. Verified by reading both files in full.

The "picker" from commit a71d928 is a **different, unrelated picker**: `TransactionForm.tsx`'s "Mes" `<Select>` (options from `monthWindow(viewedMonth, MONTH_RADIUS=3)`) chooses the **destination month for a new transaction being created** — it has nothing to do with navigating which month's list is displayed. Confirmed by reading `TransactionForm.tsx`, `AddTransactionModal.tsx`, `useFinanceV2Transactions.ts`.

So precisely: no month label exists at all, and no nav controls exist at all — not "present but broken," simply absent.

Tabs 1 (`IncomeSplitTab`) and 2 (`BudgetTab`) confirmed to have zero month concept — both operate on global, flat-keyed config (`finance-v2-dashboard-config`, `finance-v2-budget-config` in `kvAdapter.ts`). No nav precedent to borrow from them; Movimientos is the only month-scoped surface.

## Favorable finding: data layer is already month-parametrized

`features/finance-v2/data/kvAdapter.ts` already has `transactionsKey(month)`, `loadTransactions(month)` (with legacy backfill), and `saveTransactions(month, transactions)` — all take an arbitrary month already. But `loadTransactions` is **not** exported as a `"use server"` action; it's called directly inside the `app/finance-v2/page.tsx` RSC after the cookie auth-gate (documented explicitly in `features/finance-v2/data/index.ts`'s barrel comment: "there is no separate auth-gated read action ... since the page-level redirect already gates access before the loader runs"). Enabling client-driven month switching therefore requires either a new server action, or a URL-param-driven RSC re-render.

`shared/utils/monthUtils.ts` already exports `currentMonth`, `prevMonth`, `nextMonth`, `monthWindow` (all unit-tested), and `shared/utils/formatMonth.ts` exports `formatMonth(yyyyMm)` (already used for the cross-month banner) — both directly reusable for the new label/nav UI.

## Affected Areas
- `app/finance-v2/page.tsx` — computes `month = currentMonth()` once; no way today to read a requested month or expose a client-callable loader.
- `features/finance-v2/presentation/screens/Dashboard/FinanceV2Screen.tsx` — hoists all tab state per its own documented "design decision #1" (avoid remount-on-tab-switch); `viewedMonth` navigation state likely needs to live here too.
- `features/finance-v2/presentation/hooks/useFinanceV2Transactions.ts` — `viewedMonth` is currently a fixed param; needs to support re-fetch/reset of `transactions`/`totals`/`dayGroups`/`lastCrossMonthSave` when the viewed month changes.
- `features/finance-v2/presentation/components/Transactions/TransactionsTab.tsx` — needs the new month label + prev/next controls (currently has none).
- `features/finance-v2/data/financeV2Actions.ts` / `.../data/index.ts` — likely needs a new `"use server"` loader action (e.g. `handleLoadTransactions(month)`), mirroring the existing auth-gate pattern, since navigation is client-driven (confirmed with user, no URL-shareable requirement).
- `features/finance-v2/presentation/components/Transactions/TransactionForm.tsx` — its destination-month `<Select>` derives options from `viewedMonth`; unaffected in logic but should be regression-checked once `viewedMonth` becomes stateful.
- Tests referencing `viewedMonth` that will need updates: `FinanceV2Screen.test.tsx`, `TransactionsTab.test.tsx`, `useFinanceV2Transactions.test.ts`, `AddTransactionModal.test.tsx`, `TransactionForm.test.tsx`, `financeV2Actions.test.ts`.
- Next.js confirmed at `16.2.9` (`package.json`). Per `AGENTS.md`, later phases must consult `node_modules/next/dist/docs/` for this version's current server-action/searchParams conventions before implementing — do not assume older-Next patterns.

## Decision: client-side navigation (confirmed with user, no URL requirement)

Client-side navigation via a new server action — add `handleLoadTransactions(month)` mirroring the existing auth-gate pattern; `viewedMonth` becomes `useState` in `FinanceV2Screen` (or the hook), seeded from the initial server prop; prev/next handlers call the new action and reset month-scoped state.

This fits the existing architecture: `FinanceV2Screen` already hoists all tab state specifically to avoid reload/remount, and the tab already does fire-and-forget persistence through server actions. Keeps one consistent data-flow pattern instead of mixing in URL-driven RSC reloads for a single tab.

Before implementation, the design phase MUST consult `node_modules/next/dist/docs/` for Next 16.2.9's current server-action/searchParams conventions per `AGENTS.md`.

## Risks
- Stale-closure/re-fetch race when switching months mid-save — the existing `persist`/`listRef` pattern has never been exercised against a changing `viewedMonth`.
- `lastCrossMonthSave` banner must be reset on month switch or a stale "Guardado en {other month}" message could persist.
- `TransactionForm`'s destination-month options shift if `viewedMonth` changes while the Add-Transaction modal is open — needs an explicit product decision (disable nav while modal open vs. accept the shift).
- No existing tests exercise a changing `viewedMonth` within a session; new tests needed for hook re-fetch/reset behavior.
- Next.js 16 API differences (e.g. async `searchParams`) could silently break either approach if implemented from memory instead of verified docs.

## Ready for Proposal
Yes — findings are unambiguous (no label, no nav exist today; data layer and month-arithmetic utilities already support it). Open product question (URL-shareable vs client-only) resolved with user: client-only, no URL.

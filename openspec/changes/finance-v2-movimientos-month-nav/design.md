# Design: Month label + month navigation in the finance-v2 Movimientos tab

Implements the proposal's confirmed approach: client-side month state in `FinanceV2Screen`, a new
auth-gated read Server Function, and a re-fetch/reset effect inside `useFinanceV2Transactions`.
No data-layer change — `kvAdapter.loadTransactions(month)` was verified to be fully month-parametrized
already (including the legacy `month` backfill), so it is reused as-is.

## Next 16.2.9 docs consulted (AGENTS.md gate)

- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md` — the documented
  pattern for a **read** Server Function (`fetchUsers`) imported and invoked from a Client Component
  is exactly this design. Its *Security considerations* section requires reading auth **from cookies,
  not parameters**, and validating inputs inside the function. Both are honoured below.
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` — invoking a Server
  Function from `useEffect` is documented and supported. Two notes that shaped the design:
  (a) the **WARNING** that Server Functions are reachable via direct `POST`, not just through the UI,
  so `handleLoadTransactions` must gate auth itself; (b) "the client currently dispatches and awaits
  them one at a time" — this is called out as an *implementation detail that may change*, so the
  ordering guard below MUST NOT rely on it.
- **No deprecation notice affects this change.** `revalidatePath` / `refresh()` are deliberately not
  used — no existing finance-v2 action calls them and the client owns its own state; parity is intentional.

## Server action contract

```ts
// features/finance-v2/data/financeV2Actions.ts  ("use server" file directive, unchanged)
export async function handleLoadTransactions(month: string): Promise<FinanceV2Transaction[]> {
  const cookieStore = await cookies();
  if (!cookieStore.get("wishlist_auth")?.value) return [];
  if (!isTransactionMonth(month)) return [];
  return loadTransactions(month);
}
```

Same `wishlist_auth` gate and safe-default-on-denial posture as every sibling action. It validates
`month` because — unlike the existing loaders, which only ever run inside the already-gated RSC —
this one takes a client-supplied string straight into a redis key and is POST-reachable. That makes
it the second `isTransactionMonth` call site; `transactionDate.ts`'s "the ONE place" comment must be
updated to name both. (`handleSaveTransactions` still does not validate its `month`; pre-existing gap,
out of scope, noted as a risk.)

`data/index.ts` exports it, and its barrel comment ("there is no separate auth-gated read action for
any of them") becomes false and must be corrected. `app/finance-v2/page.tsx` passes it down — so the
page **is** modified, a deviation from the proposal's "unchanged".

## State ownership

| State | Lives in | Why |
|---|---|---|
| `viewedMonth` | `FinanceV2Screen` (`useState`, seeded from the new `initialMonth` prop) | Design decision #1: tabs are conditionally rendered, so month state must survive a tab switch |
| `transactions` / `listRef` | `useFinanceV2Transactions` | Unchanged |
| `loadedMonthRef` | `useFinanceV2Transactions` (new) | The month `listRef.current` actually belongs to |
| `requestIdRef` | `useFinanceV2Transactions` (new) | Monotonic token for the ordering guard |
| `isLoadingMonth` | `useFinanceV2Transactions` (new) | Minimal pending state (`aria-busy` only) |
| `isFormOpen` | `TransactionsTab` (existing) | Already local — the nav-disable needs no threading |

`FinanceV2Screen`'s prop is renamed `viewedMonth` → `initialMonth`, matching the `initial*` seed
convention of every other prop it takes.

## The ordering guard (the crux)

Two invariants, not one:

1. **`listRef.current` always belongs to `loadedMonthRef.current`** — never to `viewedMonth`.
2. **Only the response whose token still equals `requestIdRef.current` may be applied.**

```ts
useEffect(() => {
  if (loadedMonthRef.current === viewedMonth) return; // mount + every unrelated re-render

  const month = viewedMonth;
  const requestId = ++requestIdRef.current;

  setLastCrossMonthSave(null);
  setIsLoadingMonth(true);

  const apply = (list: FinanceV2Transaction[]) => {
    if (requestId !== requestIdRef.current) return; // superseded — drop silently
    loadedMonthRef.current = month;
    listRef.current = list;
    setTransactions(list);
    setIsLoadingMonth(false);
  };

  void Promise.resolve(onLoad(month)).then(apply, () => apply([]));
}, [viewedMonth, onLoad]);
```

The early return makes the effect idempotent, so `onLoad` can stay in the deps without risk even if a
caller ever passes an unstable reference.

**Invariant 1 is the one that prevents data loss**, and it is why a token alone is not enough.
`persist` currently saves to `viewedMonth`. With a pending load, this sequence corrupts data: user on
July deletes nothing, clicks *Siguiente* (August in flight, July's list still on screen), deletes a
row → `onSave("2026-08", july_list_minus_one)` **overwrites August's key with July's data**. Fix:

```ts
const persist = (next) => {
  listRef.current = next;
  setTransactions(next);
  void onSave(loadedMonthRef.current, next); // NOT viewedMonth
};
```

For the same reason `addTransaction` routes on `tx.month === loadedMonthRef.current`: a transaction
whose month equals the *requested* month but not the *loaded* one goes through `onSaveToOtherMonth`
(a server-side append to its own key) instead of polluting an in-memory list that belongs elsewhere.
In the steady state `loadedMonthRef.current === viewedMonth`, so all nine existing hook tests pass
unmodified.

**Rejection path**: `onLoad` never throws in practice (the kvAdapter swallows and returns `[]`), so a
rejection means transport failure. It applies `[]` rather than leaving the old list, because keeping
the old list would break invariant 1 and re-open the corruption window; an empty list is
indistinguishable from an empty month and needs no new UI (per the confirmed "no new empty state").

## `lastCrossMonthSave` reset

Cleared **synchronously at the start of the effect**, before the await — not on resolve. Three reasons:
a dropped/failed response would otherwise leave the banner up forever; the banner would otherwise
linger over a list mid-transition; and putting it in the effect rather than the nav handler means any
future month-changing surface (a jump-to-month picker) inherits the reset for free. Navigating *to*
the month a cross-month save landed in therefore shows the transaction with no banner — correct.

## UI wiring

`TransactionsTab` renders the existing shared `MonthNav` (already used by finance v1) above
`MovementSummary`:

```tsx
<MonthNav
  label={formatMonth(viewedMonth)}
  onPrev={() => onChangeMonth(prevMonth(viewedMonth))}
  onNext={() => onChangeMonth(nextMonth(viewedMonth))}
  disabled={isFormOpen}
/>
```

`MonthNav` gains an optional `disabled?: boolean` (default `false`, so v1's call site is untouched)
applied to both buttons plus `disabled:cursor-not-allowed disabled:opacity-50`. Unbounded — no clamp.

### `TransactionForm` is *not* just a regression check

`AddTransactionModal` renders inside a `<dialog>` that is always mounted, so `TransactionForm` never
unmounts and its **sticky** `month` state (`useState(viewedMonth)`, deliberately never reset per design
decision #6) is seeded once, at page load. Meanwhile `monthOptions = monthWindow(viewedMonth, 3)`
recomputes on every render. Navigate more than 3 months away and the controlled `<Select value>` no
longer matches any option: the browser shows the first option while state still holds the original
month, and a submit files the transaction into a month the UI never displayed. Fix: `key={viewedMonth}`
on `<TransactionForm>` in `AddTransactionModal`, mirroring v1's `key={budgetLoadedFor}` remount idiom.
Because nav is disabled while the modal is open, this remount can only happen while it is closed.

## File changes

| File | Action | Description |
|---|---|---|
| `features/finance-v2/data/financeV2Actions.ts` | Modify | `handleLoadTransactions(month)` |
| `features/finance-v2/data/index.ts` | Modify | Export it; correct the now-false barrel comment |
| `features/finance-v2/domain/transactionDate.ts` | Modify | Comment only — name both validation call sites |
| `app/finance-v2/page.tsx` | Modify | `initialMonth` + `onLoadTransactions` props |
| `.../screens/Dashboard/FinanceV2Screen.tsx` | Modify | `viewedMonth` state; thread setter + loader |
| `.../hooks/useFinanceV2Transactions.ts` | Modify | `onLoad` param, 2 refs, effect, `loadedMonthRef` save target |
| `.../components/Transactions/TransactionsTab.tsx` | Modify | `MonthNav`, `onChangeMonth`, `disabled={isFormOpen}` |
| `.../components/Transactions/AddTransactionModal.tsx` | Modify | `key={viewedMonth}` on the form |
| `shared/components/MonthNav/MonthNav.tsx` | Modify | Optional `disabled` prop |
| `useFinanceV2Transactions.test.ts`, `TransactionsTab.test.tsx`, `FinanceV2Screen.test.tsx`, `financeV2Actions.test.ts`, `MonthNav.test.tsx` | Modify/Create | See below |

## Testing strategy (strict TDD — vitest)

| Layer | What | How |
|---|---|---|
| Hook | Month change re-fetches, replaces `transactions`/`totals`/`dayGroups`, clears `lastCrossMonthSave` | `renderHook` with `rerender({ viewedMonth })`, `onLoad` as `vi.fn()` |
| Hook | **Out-of-order guard**: two deferred `onLoad` promises resolved newest-first — the older resolution is dropped | Manually-controlled deferreds, assert final list is the newest month's |
| Hook | **Corruption guard**: delete during a pending load calls `onSave` with the *loaded* month, not the requested one | Pending deferred + `deleteTransaction`, assert `onSave` arg[0] |
| Hook | Cross-month add during a pending load routes to `onSaveToOtherMonth` | Same setup |
| Hook | Rejected `onLoad` yields an empty list, clears pending, keeps the invariant | `onLoad.mockRejectedValueOnce` |
| Component | Label renders `formatMonth(viewedMonth)`; prev/next call `onChangeMonth` with the right month; both disabled once the modal is open | RTL on `TransactionsTab` |
| Component | `TransactionForm`'s month select reseeds after a month change | RTL on the tab, open modal, assert `Mes` value |
| Action | Returns `[]` unauthenticated and for a malformed month; delegates otherwise | Mirror `financeV2Actions.test.ts` cookie mocks |
| Regression | `IncomeSplitTab` / `BudgetTab` / v1 `MonthNav` suites stay green untouched | Existing suites |

## ADR-style decisions

| # | Decision | Rationale | Rejected |
|---|---|---|---|
| D1 | `persist`/routing target `loadedMonthRef.current`, not `viewedMonth` | Sole fix for writing month A's list into month B's key during an in-flight load | Disable list mutations while pending → more UI code, still leaves the closure bug |
| D2 | Monotonic `requestIdRef` compared on resolve | Correct for A→B→A; independent of Next's "one at a time" dispatch, which the docs call a mutable implementation detail | Effect-cleanup `let active` flag → correct but dies with the effect and doesn't protect `listRef`; compare-by-month → applies a stale A response |
| D3 | Clear `lastCrossMonthSave` at effect start, not on resolve | Survives dropped/failed responses; inherited by any future month-changing UI | Reset inside the nav handler → duplicated per call site |
| D4 | Load failure applies `[]` | Preserves invariant 1; matches the codebase's swallow-and-default posture; no new empty UI needed | Keep the old list → label/data divergence + re-opens D1's corruption window |
| D5 | Plain `useState` for `isLoadingMonth` | Deterministic under `renderHook`/`act`; nothing is unmounted, so there is no flash to hide | `useTransition` (the doc's `useEffect` example) → couples assertions to transition scheduling for zero UX gain |
| D6 | Reuse shared `MonthNav` + add optional `disabled` | Same nav affordance as finance v1; default `false` keeps v1 byte-for-byte | Bespoke buttons in `TransactionsTab` → duplicated markup and a second nav idiom |
| D7 | `key={viewedMonth}` on `TransactionForm` | Closes a real submit-into-the-wrong-month bug (sticky `month` vs. recomputed `monthWindow`); reuses v1's remount idiom | Controlled reset via `useEffect` → new sync-prop-to-state pattern the codebase avoids |

## Migration / rollout

No migration. No KV key, schema or stored-data change; purely additive and reversible exactly as the
proposal's rollback plan describes.

## Open questions

None blocking.

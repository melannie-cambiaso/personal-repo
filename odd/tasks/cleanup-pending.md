# Feature: cleanup pending items

Locator: `odd/tasks/cleanup-pending.md` · Engram mirror: `odd/cleanup-pending/tasks`
Branch: `chore/cleanup-pending`

## Objective
Close the three follow-ups left open on 2026-10-03: the wishlist toggle server action without an
auth check, the `react-hooks/refs` lint error in finance-v2, and the prettier drift.

## Findings
- `app/wishlist/page.tsx` `handleToggle` saves owned ids without checking the auth cookie,
  unlike `handleAdd`. `/wishlist` is behind `proxy.ts`, but a server action is callable on its own.
- `features/finance-v2/presentation/hooks/useFinanceV2Transactions.ts:71` reads
  `loadedMonthRef.current` during render (`react-hooks/refs`), on purpose, to close a stale-month
  render gap (see the comment there and commit `049311c`).
- Prettier flags 270 files, but 200 differ only by line endings: git stores LF and
  `core.autocrlf=true` checks out CRLF, while prettier defaults to `endOfLine: "lf"`. 70 files have
  real formatting drift.

## Decisions
- (agent design) Prettier: set `"endOfLine": "auto"` and format the 70 drifted files in one
  formatting-only commit.

## Tasks
- [x] T1 — Wishlist: auth check in `handleToggle`, same guard as `handleAdd`. No page tests exist; checked with tsc + eslint (build in T4). Commit `87c8a51`.
- [x] T2 — finance-v2: remove the ref read during render without reopening the stale-month gap + tests. `loadedMonth` state set in `apply` with the ref; existing stale-month test (`useFinanceV2Transactions.test.ts:533`) still green; presentation 255/255, eslint finance-v2 clean. Commit `28b227a`.
- [x] T3 — Prettier: `endOfLine: "auto"` + format drifted files (formatting-only commit). 70 files in features/ and shared/ formatted; 38 markdown docs in openspec/ and odd/ left as-is.
- [ ] T4 — Verify: `npm run test`, `npm run build`, `npx eslint .`, `npx prettier --check`.

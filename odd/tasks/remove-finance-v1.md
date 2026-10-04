# Remove finance v1

## Objective

Delete the finance v1 feature (`/finance`) now that finance v2 (`/finance-v2`) replaces it, without breaking v2, the home page, or navigation.

## Problem / Why

v1 is disabled in the nav but its code, export route, specs, and `exceljs` dependency remain. The AppNav menu still renders a `/finance` link because it ignores `disabled`. `/finance-v2` is not covered by the `proxy.ts` auth matcher.

## Scope

- Delete `app/finance/`, `features/finance/`, `app/api/finance/`.
- Update nav config and tests, `proxy.ts` matcher (`/finance` -> `/finance-v2`), drop `exceljs`, reword v2 comments citing v1.
- Delete v1-only openspec specs; update cross-references in other specs and `odd/tasks/cleanup-pending.md`.

## Constraints / Out of scope

- v1 Redis keys (`finance-categories`, `finance-budget:*`, `finance-transactions:*`, ...) stay orphaned; no deletion.
- No rename of "Finanzas v2" or `/finance-v2`.

## Delivery strategy

`exception-ok`: the change is dominated by whole-feature deletions (well over 400 changed lines) that are mechanical to review; authored edits are small. Push/PR remain the user's decision.

## Tasks

- [x] T1 Delete v1 code (`app/finance/`, `features/finance/`, `app/api/finance/`) — route: delegated (writer)
- [x] T2 Update references (nav config + tests, AppNav test, proxy matcher, `exceljs`, v2 comments) — route: delegated (same writer; 2+ non-trivial files)
- [x] T3 Docs/specs cleanup — route: delegated (same writer)

## Acceptance criteria

- No live import/link to `features/finance/` or `/finance` outside docs.
- `/finance-v2` protected by `proxy.ts`.
- Nav shows 4 items, no "Finanzas" v1 entry.

## Checks

- `npm test`, `npx tsc --noEmit`, `npm run build`, `npx eslint .`
- Test-first exception: this is a removal; the existing nav/AppNav tests are updated to the new expected state (RED observed by running them before editing `features.ts`).

## Progress / Evidence

- Branch `chore/remove-finance-v1` created from `main` (32f8182).
- T1 (delegated writer): `git rm -r app/finance features/finance app/api/finance` — 39 files removed; `features/finance-v2/` and `app/finance-v2/` untouched. Commit `a085bfe`.
- T2 (delegated writer): nav `/finance` item and the now-unused `FeatureNavItem.disabled` (+ its filter in `app/page.tsx`) removed; tests updated to 4 items; AppNav "Finanzas" `/finance` assertion dropped and its drawer link count 5 -> 4; `proxy.ts` matcher `/finance/:path*` -> `/finance-v2/:path*`; `npm uninstall exceljs`; v2 data comments no longer cite v1 files. Commit `9d4281c`.
  - RED `npx vitest run shared/navigation shared/components/AppNav` (tests updated, `features.ts` untouched): 2 failed / 9 passed (length 5 vs 4, extra `/finance` href).
  - After editing `features.ts`, one more stale count surfaced (`AppNav.test.tsx` "has no active link" expected 5 links): 1 failed / 10 passed; updated to 4.
  - GREEN same command: 11/11 passed.
- T3 (delegated writer): `git rm -r openspec/specs/finance-budget-summary openspec/specs/finance-budget-unit-mode`; `mobile-navigation` example route -> `/finance-v2`; `savings-monthly-breakdown` no longer points at `features/finance/`; `cleanup-pending.md` notes v1 lint findings are gone. Commit `66b018b`.
- Verification:
  - reference `rg` (features/finance, quoted `/finance`, excluding v2/.git/node_modules/.next): no live code hits; remaining hits are archived openspec changes, `odd/tasks/paper-restyle.md` (historical), and this document.
  - `npm test`: 81 files / 777 tests passed.
  - `npx eslint .`: exit 0, no output (same as the pre-change baseline).
  - `npx tsc --noEmit`: FAILS only in stale generated `.next/dev/types/validator.ts` (dev-server output, gitignored) that still imports `app/finance/page.js` and `app/api/finance/budget/export/route.js`. Same config excluding `.next/dev`: exit 0.
  - `npm run build`: compiles, then type check fails on the same stale `.next/dev/types/validator.ts`.
  - After deleting the stale `.next/dev` (no dev server running): `npx tsc --noEmit` exit 0; `npm run build` exit 0, route list shows `/finance-v2` and no `/finance`.
  - `npx prettier --check` on edited code files: clean (after `--write` on `features.test.ts`).
- Split: the original code commit (`266f846`, kept on `backup/remove-finance-v1-pre-split`) exceeded the native review context budget (`lens_context_budget_exceeded`), so it was split into deletions (`a085bfe`) and reference edits (`9d4281c`); the final tree is identical to the pre-split branch.
- Native review (RDD): `9d4281c` assessed medium, consent granted, one reliability lens, approved and acknowledged (lineage `review-d2e3963c811098b9`, authority burned). Non-blocking advisories for later work: `proxy.ts` matcher has no test (WARNING); `exceljs` removal not proven by a test (SUGGESTION). `a085bfe` (pure deletions) and `66b018b` (docs) were not reviewed.

## Next step

All checks pass. Push/PR at the user's discretion; optional follow-ups: add a `proxy.ts` matcher test, delete `backup/remove-finance-v1-pre-split`.

# Feature: home finance summary

Locator: `odd/tasks/home-finance-summary.md` · Engram mirror: `odd/home-finance-summary/tasks`
Branch: `feat/home-finance-summary`

## Objective
Restructure the home page so the finance section shows a simple summary of the current month
(how much should be in the account) with a "Ver más" link to `/finance-v2`.

## Decisions (user-confirmed 2026-10-03)
- Layout: a wide finance summary card at the top; the other sections (Casa, Ahorros, Wishlist)
  below as smaller shortcuts.
- Figures: month balance ("Balance del mes"), pending from the main account ("Pendiente por
  pagar"), and "Te sobran $X" / "Te faltan $X" — the same figures as the finance-v2 Movimientos
  balance and the Budget tab `AccountCoverage` card, for the current month.
- (agent design) Computed on the server with the same domain functions
  (`computeTransactionTotals`, `computePendingFromMain`) so home and finance-v2 never disagree.
- "Ver más →" navigates to `/finance-v2`.

## Constraints
- `/` is already behind the auth proxy (`proxy.ts`); the page must still not leak figures
  without the auth cookie (same guard as `app/finance-v2/page.tsx`).
- Next.js 16 with breaking changes: read `node_modules/next/dist/docs/` before framework code.
- Hexagonal layout; UI copy in Spanish.

## TDD
Mode: on · Runner: `vitest run` (`npm run test`)

## Tasks
- [x] T1 — Data: `loadHomeFinanceSummary(month)` in finance-v2 data (balance, pending) + tests. 3 tests, RED→GREEN, tsc clean. Commit `43cb8f1`.
- [x] T2 — UI: finance summary card + home restructure (summary on top, other sections below) + tests. 5 card tests RED→GREEN; page guarded by cookie + redirect before loading; build green. Commit `7c70f2c`.
- [x] T3 — Verify: full `npm run test`, `npm run build`. Tests 902/902, build green, `/` dynamic.

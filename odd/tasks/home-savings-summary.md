# Feature: home savings summary

Locator: `odd/tasks/home-savings-summary.md` · Engram mirror: `odd/home-savings-summary/tasks`
Branch: `feat/home-savings-summary`

## Objective
Show a savings summary card on the home page, like the finance and wishlist cards, so the
user can check savings at a glance and open `/savings` for details.

## Decisions (user-confirmed 2026-10-04: "Balance + a reponer")
- Card shows two figures for the ACTIVE savings period: "Balance" and "A reponer", plus
  "Ver más →" to `/savings`. No goals list.
- (agent design) Figures come from the same domain functions and inputs as the `/savings`
  page (`resolveActivePeriod` + `selectPeriodEntries` + balance / `computeTotalToReplenish`,
  including the period initial amount exactly as `useSavings` does), so both pages never
  disagree.
- (agent design) Ahorros leaves the home shortcuts (like Finanzas and Wishlist); Casa remains.
  Butter palette, sibling style of `FinanceSummaryCard` / `WishlistSummaryCard`.

## Constraints
- Next.js 16 with breaking changes: read `node_modules/next/dist/docs/` before framework code.
- Home already guards auth before loading data (`app/page.tsx`).
- Loader is `server-only`, not a Server Action; import by path if the savings `data` barrel is
  used by client components.

## TDD
Mode: on · Runner: `vitest run` (`npm run test`)

## Delivery
Strategy: `ask-on-risk` · Forecast: ~200 authored lines (under the ~400 budget).

## Tasks
- [x] T1 — Data: `loadHomeSavingsSummary()` server loader (balance + toReplenish of the active period) + tests. Route: delegated (writer; part of 2+ non-trivial files). Reuses existing `resolveActivePeriod`, `selectPeriodEntries`, `computePeriodBalance` (initial amount included, as `useSavings`) and `computeTotalToReplenish`; no domain extraction needed. Imported by path. 3 loader tests RED (missing module) → GREEN, savings 172/172. Commit `8153604`.
- [x] T2 — UI: `SavingsSummaryCard` + tests; render it on home after the auth guard, loaded in parallel; remove `/savings` from shortcuts. Route: delegated (same writer). 5 card tests RED (missing module) → GREEN, savings 177/177; tsc clean, lint clean. Cards grid `lg:grid-cols-3`; the remaining shortcut (Casa) is a centered `sm:w-64` tile. Commit `4824ed3`.
- [x] T3 — Verify: full `npm run test`, `npm run build`. Tests 800/800 (83 files), build green. Route: inline (bounded commands).

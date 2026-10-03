# Feature: home wishlist summary

Locator: `odd/tasks/home-wishlist-summary.md` · Engram mirror: `odd/home-wishlist-summary/tasks`
Branch: `feat/home-wishlist-summary`

## Objective
Show a simple wishlist summary on the home page, like the finance summary, linking to `/wishlist`.

## Decisions (user-confirmed 2026-10-03: summarize Wishlist)
- (agent design) Card below the finance card, same visual style: "Pendientes" (count of items not
  owned), "Total aprox." (sum of pending items with a price, same rule as the `/wishlist` header),
  up to 3 pending Alta-priority items in priority-sort order (title + price or "Falta precio"),
  "Ver más →" to `/wishlist`. No Alta items → a muted "Nada con prioridad alta" line.
- (agent design) Wishlist leaves the home shortcuts (like finance); Casa and Ahorros remain.
- (agent design) One pure domain function computes the summary; the `/wishlist` header uses the
  same pending/total rule so both pages never disagree.

## Constraints
- Next.js 16 with breaking changes: read `node_modules/next/dist/docs/` before framework code.
- Home already guards auth before loading data (`app/page.tsx`).

## TDD
Mode: on · Runner: `vitest run` (`npm run test`)

## Tasks
- [x] T1 — Domain + data: `summarizeWishlist(items, ownedIds)` (reused by `useWishlist`) and a server loader + tests. Loader imported by path (wishlist `data` barrel is used by a client component). RED→GREEN, wishlist 75/75, tsc clean.
- [ ] T2 — UI: wishlist summary card on home, shortcuts without Wishlist + tests.
- [ ] T3 — Verify: full `npm run test`, `npm run build`.

# Feature: wishlist tag in list + remove brand and category

Locator: `odd/tasks/wishlist-tag-cleanup.md` · Engram mirror: `odd/wishlist-tag-cleanup/tasks`
Branch: `feat/wishlist-tag-cleanup`

## Objective
Show each item's tag in the wishlist list, and remove the "Marca / Tienda" and "Categoría"
fields so they no longer exist.

## Decisions (user request 2026-10-04)
- The tag shows on the list row (`WishlistItemRow`) when the item has one; no tag → nothing.
- (agent design) Tag renders as a small outlined pill next to the price, blush tone, so it
  never reads as a button (same idea as the outlined type pills in home-improvements).
- (agent design) "Ya no existan" = removed end to end, not just hidden: form fields,
  `brand` and `category` on `WishlistItem`, `Category`/`CategoryColor`, `CATEGORIES`, the
  seed data and tests. Neither field is displayed anywhere today, so no UI loses data.
- Items already stored in Redis keep the extra `brand`/`category` keys until they are
  edited; they are ignored (no migration needed).

## Constraints
- Next.js 16 with breaking changes: read `node_modules/next/dist/docs/` before framework code.
- No PRs in this repo: the branch is fast-forwarded into `main` with the user's go-ahead.

## TDD
Mode: on · Runner: `vitest run` (`npm run test`)

## Delivery
Forecast: ~150–250 authored lines (mostly deletions), under the ~400 budget.

## Tasks
- [x] T1 — Show the tag on `WishlistItemRow` + tests. Route: delegated (writer; 2+ non-trivial files overall).
  - Outlined pill (`bg-cream-50 border-2 rounded-full`, blush; brown-muted when owned) in the
    price line, `max-w-40 min-w-0 truncate` for ~360px. Empty/absent tag renders nothing.
  - RED: `npx vitest run features/wishlist/presentation/components/List` → 3 failed | 19 passed.
  - GREEN: same command → 23 passed (23).
- [ ] T2 — Remove brand and category end to end (form, domain, data, seed, tests). Route: delegated (same writer).
- [ ] T3 — Verify: full `npm run test`, `npm run build`.

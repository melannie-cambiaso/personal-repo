# Feature: wishlist checklist

Locator: `odd/tasks/wishlist-checklist.md` · Engram mirror: `odd/wishlist-checklist/tasks`
Branch: `feat/wishlist-checklist`

## Objective
Turn the wishlist card grid into a simple checkable list that still links to each item's URL,
make price required, and sort by priority.

## Decisions (user-confirmed 2026-10-03)
- Priority: three levels, Alta / Media / Baja.
- Checking an item ("lo tengo", existing `ownedIds`) moves it to the end of the list, struck
  through; it can be unchecked.
- Stored items without price stay visible with a red "Falta precio" mark; editing them requires
  a price. Nothing is overwritten with $0.
- (agent design) Row: checkbox, title, priority badge, price (or "Falta precio"), ↗ link opening
  the URL in a new tab, small ✕ delete (owner only, existing confirm modal); tapping the row opens
  edit (owner only).
- (agent design) Default sort: priority (Alta first), then price ascending; the sort select keeps
  price and name options. Owned items always go last.
- (agent design) Stored items without `priority` resolve to Media. No stored data is removed:
  image, brand, description, tag, emoji and category stay in the model and the edit modal, they
  are just not shown in the list.
- (agent design) Price stays `number | null` in storage for legacy rows; the form enforces it.

## Constraints
- Next.js 16 with breaking changes: read `node_modules/next/dist/docs/` before framework code.
- Hexagonal layout; UI copy in Spanish; keep the `isOwner` read-only behavior for visitors.

## TDD
Mode: on · Runner: `vitest run` (`npm run test`)

## Tasks
- [x] T1 — Domain: `priority` field + resolver (legacy → Media), priority sort (default) with owned-last + tests. `sortItems(items, key, ownedIds?)`; `"default"` kept (insertion order). RED→GREEN, wishlist 48/48. Commit `cc02ab6`.
- [x] T2 — Modal: price required, priority select (default Media) + tests. Price moved above the optional divider; `parsePrice` guard blocks blank/negative/NaN. RED→GREEN, wishlist 56/56. Commit `cbe4c24`.
- [x] T3 — List UI: replace the card grid with checklist rows, sort select with priority, remove the card + tests. `WishlistItemRow` in one list container; visitors keep the toggle (pre-existing behavior), edit/delete owner-only. RED→GREEN, wishlist 66/66. Commit `8ecfb4c`.
- [x] T4 — Verify: full `npm run test`, `npm run build`. Tests 934/934, build green, eslint wishlist clean.

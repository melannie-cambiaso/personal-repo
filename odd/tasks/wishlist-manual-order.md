# Feature: wishlist manual order

Locator: `odd/tasks/wishlist-manual-order.md` · Engram mirror: `odd/wishlist-manual-order/tasks`
Branch: `feat/wishlist-manual-order`

## Objective
Let the user order wishlist items by hand within each priority, replacing the sort select.

## Decisions (user-confirmed 2026-10-03)
- Priority still groups the list (Alta → Media → Baja, owned last); the manual order applies within
  each group.
- Moving is done with ↑ ↓ buttons (works without a mouse and on the phone).
- (agent design) The order is the stored items array order — no new field. Moving swaps the item
  with its neighbor in the same group and saves the whole list.
- (agent design) Group headings ("Alta", "Media", "Baja", "Comprados") replace the per-row
  priority badge. Edge buttons are disabled; owned items have no arrows. Owner-only controls.
- (agent design) The sort select is removed; a new item lands at the end of its group; the home
  card's top Alta items follow the manual order.

## Tasks
- [x] T1 — Domain: `orderWishlist` (grouped, array order within group) + `moveItem` (swap within group); `summarizeWishlist` uses it; remove `sortItems` + tests. (`sortItems` removal moved to T2 so no commit breaks the screen.) No-op moves return the same array reference. RED→GREEN, wishlist 94/94. Commit `422d103`.
- [x] T2 — UI: hook `move`, group headings, ↑↓ buttons, drop the sort select and row badge + tests. `sortItems` removed. RED (15 failing) → GREEN, wishlist 89/89.
- [ ] T3 — Verify: `npm run test`, `npm run build`, `npx eslint .`, prettier.

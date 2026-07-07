# Exploration: Mobile-first pass for `wishlist-meme`

## Current State

- **Viewport meta**: No explicit `viewport` export anywhere (`app/layout.tsx` only sets fonts/metadata). Next.js auto-injects `width=device-width, initial-scale=1` by default per `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md` — not a gap, no action needed.
- **Tailwind config**: CSS-based v4 config in `app/globals.css` via `@import "tailwindcss"` + `@theme`. No `tailwind.config.*` file exists. Custom tokens: colors (`cream-*`, `brown-*`, `cat-*`), font sizes (`--text-2xs`, `--text-product`), shadows, radii. No custom breakpoints, no container queries.
- **No shared nav/header component.** No persistent top-nav/hamburger — each route uses its own `PageHeader` (`shared/components/PageHeader/PageHeader.tsx`): centered gradient hero with a "← Inicio" back-link absolutely positioned top-left. The home page (`app/page.tsx`) is the de facto nav — a card grid linking to each feature.
- **Existing responsive patterns already in use** (precedent to follow, not reinvent):
  - `app/page.tsx`: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - `features/wishlist/.../DashboardScreen.tsx`: `grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4`
  - `features/home-improvements/.../ZoneList.tsx`: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - `features/savings/.../SavingsSummaryCards.tsx`: `grid-cols-2 gap-4 sm:grid-cols-4`
  - Mobile-first grid stacking already exists in roughly half the codebase — this is the reference pattern to extend, not replace.
- **Shared UI components** live under `shared/components/` (`Button`, `Input`, `Field`, `AddButton`, `ModalShell`, `MonthNav`, `PageHeader`, `ProgressBar`), reused across features. `ModalShell` is a native `<dialog>` with `maxWidth: sm|md|lg`, centered via `m-auto`, fluid-width `w-full` capped by `max-w-*` — generally fine on mobile.
- **Architecture**: feature-based/hexagonal — `features/{name}/{domain,data,presentation}` + `presentation/{screens,components}`. Consistent across all 7 features; `shopping-list` (most recently built) follows the same shape, nothing mobile-specific added there.

## Affected Areas (desktop-first breakage found)

- **`features/finance/presentation/components/Budget/BudgetTab.tsx`** — clearest desktop-first offender. Hardcoded `grid-cols-4` (no responsive variant), used three times (summary cards, column headers, each category row, totals row) to lay out category name + budget input + actual amount + diff in `text-2xs`/`text-xs`. On a ~375px viewport this is 4 columns of ~85px holding currency strings like `"$1.234.567"` — will wrap/clip. Icon-only action buttons (`+`, "Cerrar/Abrir") are `px-1.5 py-0.5 text-xs` — well under the ~44px touch-target guideline.
- `BudgetTab.tsx:93-115` — horizontal control bar (`flex items-center gap-3`) mixing `<input type="month">`, "Copiar" button, "Exportar a Excel" link with `whitespace-nowrap` — no wrap fallback, will overflow narrow screens.
- `features/shopping-list/presentation/components/List/ShoppingItemRow.tsx` and `CategoryTabs.tsx` — edit/delete affordances are bare icon glyphs (`✎`, `✕`) at `text-xs`/`text-sm` with no padding box — small tap targets. Checkbox is `h-4 w-4` (16px), below typical touch guidance (standard native-checkbox size, possibly an accepted tradeoff).
- Form-field grids in several modals — `grid-cols-2 gap-4` with no responsive fallback in `WishlistAddItemModal.tsx`, `EditItemModal.tsx` / `AddItemModal.tsx` (home-improvements), `ItemFormFields.tsx`, `EntryFormFields.tsx` (savings). Inside `ModalShell` (`max-w-sm/md/lg`), so two columns at ~375px leaves ~150px per field — workable for short inputs, cramped for currency/date fields. Review per-modal, don't assume uniformly fine.
- `shared/components/PageHeader/PageHeader.tsx` — the "← Inicio" back-link is the *only* nav affordance on every feature page; small text+icon link, no extra padding, absolutely positioned in a corner. No way to jump between sibling features without returning to `/` first. Not "broken", but a nav-model constraint any mobile-first proposal should explicitly keep or change.
- No `hover`-gated reveal patterns found (`group-hover`/`opacity-0` — zero matches). Action buttons are always rendered, not hover-revealed, so touch users aren't locked out of controls — good, not a gap.

## Testing Implications

- Stack: Vitest 4 + `@testing-library/react` 16 + jsdom (`vitest.config.mts`, `environment: "jsdom"`, `globals: true`, no `setupFiles`).
- Current tests are behavior-based: `render` + `screen.getByRole`/`getByText` + `fireEvent`. None assert on CSS classes, computed layout, or viewport size.
- No `window.matchMedia` mock exists anywhere (grep for `matchMedia|innerWidth|ResizeObserver` — zero matches) — nothing today does JS-driven responsive branching. jsdom doesn't evaluate CSS media queries, so Tailwind breakpoint classes are inherently unverifiable by unit tests — a boundary to respect, not a gap to fix.
- **Implication**: if the work stays within Tailwind utility classes (e.g. `grid-cols-4` → `grid-cols-2 sm:grid-cols-4`, padding/text-size at breakpoints, larger tap targets), existing test patterns need no changes.
- If a future slice introduces JS-driven responsive behavior (hamburger nav, `useMediaQuery`-based component swap), that requires adding a `window.matchMedia` mock and a `setupFiles` entry (none exists today) — the one place strict TDD needs a genuinely new test pattern.

## Approaches Considered

1. **Utility-only Tailwind pass** (extend existing `sm:`/`md:`/`lg:` convention to screens that lack it, mainly `BudgetTab` + modal form grids; bump icon-only buttons to a minimum tap area). Low risk, consistent with current conventions, incremental. Con: `BudgetTab`'s 4-column dense table needs structural rework, not just a breakpoint tweak.
2. **Shared responsive nav/layout shell** (persistent bottom-tab-bar or hamburger drawer replacing the "every page links back to `/`" model). Better cross-feature mobile UX. Con: new shared component, new interaction tests, likely needs `matchMedia` mock — larger surface, higher review cost.
3. **Full component-level responsive redesign per feature**, sliced by feature folder. Matches existing architecture, keeps diffs small per PR, lets `BudgetTab` get proper structural treatment. Con: more slices to coordinate; needs a shared convention/checklist first to avoid inconsistent per-feature decisions.

## Recommendation

Combine (1) and (3): a utility-first pass per feature, sliced by feature folder, with `BudgetTab` carved out as its own structural slice (breakpoint classes alone won't fix it). Defer (2) — the current back-link nav model isn't strictly broken; adding a persistent nav shell is a UX/scope decision that should go through `sdd-propose` explicitly rather than being bundled implicitly into "mobile-first". Given the existing partial responsive precedent, the proposal should codify a written convention (min tap target size, standard grid breakpoint pattern, when to reflow a table into stacked cards) so features apply it consistently.

## Risks

- `BudgetTab` is dense, financial, and highest-risk to regress silently — any reflow (table → stacked cards) needs careful QA since it's the money screen.
- No visual/E2E regression tooling exists (no Playwright/Chromatic) — mobile-first changes are effectively unverifiable by the automated suite beyond behavior assertions; manual/device testing needed as a gate.
- Modal form grids (`grid-cols-2`) span 5+ files with near-identical patterns — risk of inconsistent fixes if not centralized into a shared responsive form-grid convention during design.
- If a future slice introduces JS-driven responsive branching, it needs new test infra (`matchMedia` mock + `setupFiles`) that doesn't exist today — flag early in `sdd-design` if that path is chosen.

## Status

Ready for proposal. Scope is well-understood: enumerate per-feature Tailwind/tap-target fixes as the core proposal, treat `BudgetTab`'s table restructure as a distinct task, and explicitly decide (in the proposal, not silently in code) whether a shared nav shell is in scope or deferred.

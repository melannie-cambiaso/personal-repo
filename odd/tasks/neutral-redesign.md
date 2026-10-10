# Feature: neutral redesign

## Objective
Move personal-repo from the hand-written "notebook" look (Patrick Hand font, cream/pastel
paper palette, rotated sticker, wavy underlines) to a minimal neutral dark design
(Vercel/Linear style) with the Gentleman-Cute pink as the single accent color.

## Problem / why
The user no longer likes the notebook style from the last redesign. They want to keep the
dark theme, but make everything else simpler and more generic.

## Decisions (user)
- Style: minimal neutral. Near-black gray surfaces, subtle borders, white/gray text, one accent.
- Accent: Gentleman-Cute pink (`#F095C8`, active `#FFB1DD`, deep `#C96AA2`),
  from `gentle-pi/themes/Gentleman-Cute.json`.
- Home dog image (`/home-greeting.png`) stays. The rotated "¿Qué querés ver hoy?" sticker goes.
- Dark theme stays (the `<html>` element is always `.dark`).

- Plan change (after T3): the user wants to KEEP the hand-written font (Patrick Hand, with
  Lexend for figures). What they dislike is the number of colors, not the font.

## Scope / constraints
- Colors come from `@theme` tokens in `app/globals.css`. Retheme by redefining the `.dark`
  values first, so the 51 components that use the palette change without being edited.
- Keep semantic hues only where they carry meaning (positive/negative/pending). Panel fills
  and borders become neutral.
- Token renames (cream/brown → semantic names) are out of scope, because that would be a
  51-file churn. Follow-up candidate.
- UI copy stays in Spanish (existing project convention).

## Tasks
- [x] T1 — Theme tokens: neutral dark surfaces/ink, neutralized pastel fills/borders, pink
  accent tokens, flat gradients, and Geist sans replacing Patrick Hand (`app/globals.css`, `app/layout.tsx`)
- [x] T2 — Remove notebook decorations: `font-dancing`, `underline-wavy`, rotations and the home
  sticker (~30 component files plus tests that assert those classes)
- [x] T3 — Interactive states use the pink accent: active tabs, primary pills/buttons and focus
  rings currently on `sage-500`/`lilac`

- [x] T4 — Restore Patrick Hand + Lexend (`app/layout.tsx`, `app/globals.css`) and drop the
  faux-bold `font-semibold tracking-tight` that T2 added to headings (Patrick Hand has one weight)

- [x] T5 — Fewer colors: in dark mode the tone fills/borders (100/300) become pure neutral, and the
  home summary cards plus the shortcut tile use neutral cards and icon circles, with pink "Ver más"
  pills. Only green/red figures keep a hue (user feedback: "me siguen pareciendo mucho")

- [x] T6 — Wishlist: the salmon (`blush-800`) text is too loud. Make the stat labels, tags, round
  buttons and priority pills neutral, make the AddButton pink instead of white, and give native
  checkboxes a dark look (`color-scheme: dark`). Leave it UNCOMMITTED for the user's review.

- [x] T7 — Status colors from the Gentleman-Cute Pi theme: mint green #b4e7c7, champagne yellow
  #e0c27a, powder blue #a9c7ee, and a matching pastel red #f28b82 (`.dark` overrides for the
  green/red/amber/sky figure colors and the tone 500/800 levels). The danger button text is now dark. UNCOMMITTED.

- [x] T8 — One flat background everywhere: mauve #342d34 (sampled from the user's screenshot) for the
  page, header band, cards and tone panels, with borders #4a414a, pill/hover #3e363e, and the dark
  brand-100 lifted to #4a2f42. UNCOMMITTED.

- [x] T9 — Wishlist: the tag text and the round-button glyphs (↑ ↓ ↗ ✕) are pink (`brand-500`), and the
  arrows use U+FE0E so Windows renders text glyphs, not emoji. UNCOMMITTED.

- [x] T10 — Savings consistency plus the Gentle Shell status-bar colors. Red is now #ff718f and yellow is
  #f2b86d (green stays mint #b4e7c7). In savings: pink active tabs, neutral "registros" and "Monto
  inicial" labels, and pink goal reorder/action glyphs. The secondary Button border changes from
  light (`brown-800`) to `cream-400`. UNCOMMITTED.

## Acceptance criteria
- Hand-written font kept; no wavy underline or rotated element remains.
- Surfaces are neutral grays, and pink is the only accent for interactive/selected states.
- Positive/negative figures stay distinguishable.
- `npm test`, `npx tsc --noEmit` and `npm run lint` pass.
- The user checks it visually with `npm run dev`.

## Verification note
These are visual CSS/class changes, so there is no meaningful RED test. Verification is
the existing suite (updated where it asserts removed classes), the type check, lint, and
the user's visual review.

## Delivery
Strategy: feature branch `feat/neutral-redesign`, with one work-unit commit per task.
Push/merge are the user's decision.

## Progress / evidence
- T1 `01e444e`: `.dark` tokens are now neutral grays, with near-neutral tone fills/borders and
  lilac → pink. `--color-brand-*` tokens were added, gradients are flat, shadows are off in
  dark mode, and the card radius is 0.75rem. Geist replaces Patrick Hand and Lexend, and
  `font-figure` uses Geist with tabular nums. Verified (verifier): tsc OK, 866/866 tests,
  eslint OK, `npm run build` OK. Native review: consent declined for this candidate.
- T2 `530e13f`: removed font-dancing, underline-wavy and its decoration colors, the rotations,
  and the home sticker (now plain muted text). Headings use `font-semibold tracking-tight`.
  The dead `--font-dancing` alias and `@utility underline-wavy` were deleted. No tests asserted
  the removed classes. Verified (worker): grep clean, tsc OK, 866/866 tests, eslint OK.
  Native review `review-ac17cab32ad3ca62`: consent granted, but the reviewer model refused the
  relay prompt twice (it treated it as a prompt injection) and returned no JSON. The lineage is
  left open and unapproved, and the user chose to continue.
- T3: primary Button, Input focus, active nav, tab/mode pills, "Ver más" pills and checkbox
  accents now use `brand-*`. Semantic sage/blush/butter are unchanged. Verified (worker): tsc OK,
  866/866 tests, eslint OK (1 pre-existing unused-disable warning). Commit `afdbb00`.
- T4: Patrick Hand + Lexend restored and the body font-size is back to 1.0625rem. The 17 faux-bold
  heading classes from T2 were removed. Verified (verifier): tsc OK, 866/866 tests, eslint OK,
  build OK, greps clean.
- T5 (UNCOMMITTED on purpose): the user wants to review changes before they get committed.
  Neutral `.dark` tone 100/300, neutral home cards, icon circles and shortcut tile, pink "Ver más".
  Verified (verifier): tsc OK, 866/866 tests, eslint OK.
- Native review switched off for this clone at the user's request (`gentle-ai review mode disable
  --scope clone`). Lineages review-ac17cab32ad3ca62 and review-39c7ad1d9d69174f are left open and unapproved.
- T6 (UNCOMMITTED): wishlist stat labels, tags and round buttons are neutral; the priority pills are
  neutral; AddButton uses `brand-500`; `.dark` sets `color-scheme: dark`. RED: the WishlistItemRow
  tag test expected `text-brown-600` and failed; GREEN: 23/23. Full verify: tsc OK, 866/866, eslint OK.
- T7 (UNCOMMITTED): verified (verifier): tsc OK, 866/866, eslint OK, build OK.
  User preference: make edits only with the edit/write tools so they show up in Alt+G.
- T8 (UNCOMMITTED): only CSS custom-property values changed in the `.dark` block. Not
  build-verified (the same token structure built fine in T7). Needs the user's visual check.
  Not touched: the `bg-black text-white` login button in app/login/page.tsx.
- T9 (UNCOMMITTED): RED: the tag test expected `text-brand-500` and failed; GREEN: wishlist suite
  96/96, tsc OK, eslint OK.
- T10 (UNCOMMITTED): visual class/token changes with no tests on these classes. Checks: tsc OK,
  savings+shared 224/224, eslint OK.
- Full verify over the uncommitted T5–T10 tree (verifier): tsc OK, 866/866 tests, eslint OK (only the known
  unused-disable warning), `npm run build` OK (10/10 static pages, no Turbopack panic). User approved visually.
- Commits (T5–T10 share files, so they are grouped by area instead of per task): `c23e0fa` theme tokens,
  `dc41a93` home cards, `d598934` wishlist, `8689551` savings + buttons + this doc.

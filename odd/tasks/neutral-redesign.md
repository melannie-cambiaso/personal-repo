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

## Scope / constraints
- Colors come from `@theme` tokens in `app/globals.css`. Retheme by redefining the `.dark`
  values first, so the 51 components that use the palette change without being edited.
- Keep semantic hues only where they carry meaning (positive/negative/pending). Panel fills
  and borders become neutral.
- Token renames (cream/brown → semantic names) are out of scope, because that would be a
  51-file churn. Follow-up candidate.
- UI copy stays in Spanish (existing project convention).

## Tasks
- [ ] T1 — Theme tokens: neutral dark surfaces/ink, neutralized pastel fills/borders, pink
  accent tokens, flat gradients, and Geist sans replacing Patrick Hand (`app/globals.css`, `app/layout.tsx`)
- [ ] T2 — Remove notebook decorations: `font-dancing`, `underline-wavy`, rotations and the home
  sticker (~30 component files plus tests that assert those classes)
- [ ] T3 — Interactive states use the pink accent: active tabs, primary pills/buttons and focus
  rings currently on `sage-500`/`lilac`

## Acceptance criteria
- No hand-written font, wavy underline or rotated element remains.
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

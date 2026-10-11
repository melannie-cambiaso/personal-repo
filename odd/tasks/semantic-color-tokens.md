# Feature: semantic color tokens

## Objective
Rename the palette tokens from appearance names (`cream`, `brown`, `sage`, `blush`, ...) to
role names, so a future palette change only touches `app/globals.css` and the names stay true.

## Problem / why
After the neutral redesign, `cream-50` is mauve and `brown-900` is near-white. The names describe
the old look, not the role, which makes the theme confusing to change. Follow-up from
`odd/tasks/neutral-redesign.md`.

## Decisions (user)
- Staged: first the mechanical core rename, then audit the pastel hues usage by usage.
- Pastel mapping (after T2): status names. `{sage,blush,butter,mist,lilac}-100/300` → `surface-100/300`
  (identical in dark mode); `sage-500/800` → `success-*`, `blush` → `danger-*`, `butter` → `warning-*`,
  `mist` → `info-*`; `lilac-500` → `brand-400`, `lilac-800` → `brand-600` (identical values), and the broken
  `lilac-600` → `brand-600`. Accepted trade-off: some decorative panels get status names.

## Scope / constraints
- Stage 1 mapping (1:1, scale numbers kept): `cream-N` → `surface-N` (backgrounds, borders),
  `brown-N` → `ink-N` (text). Applies to `--color-*` definitions, `var(--color-*)` and utility classes.
- Only git-tracked files (`git grep`); never `.git/` (it holds gentle-ai candidate copies) or `odd/`.
- Pastel hues (`sage`, `blush`, `butter`, `mist`, `lilac`) mix semantic and decorative uses
  (e.g. `blush` is both "negative" and the wishlist tone), so they need a per-usage audit.
- No visual change: every renamed token keeps its exact value.

## Tasks
- [x] T1 — Rename `cream-*` → `surface-*` and `brown-*` → `ink-*` across 50 tracked files (tokens,
  classes and tests), with no value changes
- [x] T2 — Audit the pastel hue usages and propose a role mapping (success/danger/warning/info/accent
  vs. decorative) for the user's approval
- [x] T3 — Apply the approved pastel mapping

## Acceptance criteria
- No `cream-`/`brown-` token remains in tracked source after T1.
- The CSS output is visually identical (same values, the build passes).
- `npx tsc --noEmit`, `npm test`, `npm run lint` and `npm run build` pass.

## Verification note
This is a pure rename refactor, so there is no meaningful RED test. Evidence is a grep for zero
leftovers plus the existing suite, the type check, lint and the build.

## Delivery
Feature branch `refactor/semantic-color-tokens`, one work-unit commit per task. The merge to `main`
is the user's decision (no PRs in this repo).

## Progress / evidence
- T1 (UNCOMMITTED, waiting for the user's review): worker used `perl -pi` over the `git grep -lz` list, so
  the edits do not show in Alt+G; review with `git diff`. 50 files, 236+/236-, line endings preserved.
  The leftover grep is empty. tsc OK, 866/866 tests, eslint OK (the known warning), build OK. Commit `c6b271a`.
- T2 audit (explorer + spot checks): live usages outside globals.css are 100×25, 300×68, 500×19, 800×31.
  - In `.dark`, the 100/300 levels of every hue equal surface-100 (#342d34) / surface-300 (#4a414a), so mapping
    them to `surface-*` changes no pixel.
  - The 500/800 levels mix feature-panel identity (the hues cross features: sage is in finance, savings and
    home-improvements) with a few real status uses (e.g. `EnvelopeReminder.tsx:17` warning).
  - lilac 500/800 equal brand 400/600 in dark mode.
  - Pre-existing bug: `TransactionRow.tsx:59` uses `hover:text-lilac-600`, but no `--color-lilac-600` exists, so
    the hover does nothing.
  - No dynamically built hue classes (the `${tone}` props pass whole class strings).
- T3 (reviewed by the user with `git diff`): `perl -pi` over the 30 tracked component files using
  pastel tokens (100+/87-), plus `app/globals.css`: pastel definitions removed, `success/danger/warning/info`
  500/800 added with the old sage/blush/butter/mist values. The leftover grep is empty and the rename created
  no duplicate classes. Light-mode values of the panels change, but light mode is unreachable
  (`app/layout.tsx:28` hard-codes `dark`). `lilac-600` → `brand-600` turns on the formerly dead hover in
  `TransactionRow.tsx` (the only intended visual change). tsc OK, 866/866 tests, eslint OK (the known
  warning), build OK.

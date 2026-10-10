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
- [ ] T2 — Audit the pastel hue usages and propose a role mapping (success/danger/warning/info/accent
  vs. decorative) for the user's approval
- [ ] T3 — Apply the approved pastel mapping

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
  The leftover grep is empty. tsc OK, 866/866 tests, eslint OK (the known warning), build OK.

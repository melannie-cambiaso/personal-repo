# Feature: paper restyle

Locator: `odd/tasks/paper-restyle.md` · Engram mirror: `odd/paper-restyle/tasks`
Branch: `feat/paper-restyle`

## Objective
Restyle the whole app after a hand-drawn infographic reference: cream paper background, dark ink
text, pastel tinted section panels with a slightly darker border, pill labels, icon circles,
wavy underlines and a handwritten font.

## Decisions
- (user, 2026-10-03) Whole app, in stages: global theme and home first, then each section in its
  own commit.
- (user, 2026-10-03) Handwritten font for titles, labels and text; money figures stay in a
  legible font.
- (agent design) Handwritten font: Patrick Hand (`next/font/google`, weight 400). Figures: Lexend
  through a new `font-figure` utility applied to amount render sites.
- (agent design) Recolor through tokens: `cream-*` become paper tones and `brown-*` become ink
  tones, so most of the app follows automatically. Pastel panel tokens use custom names
  (`lilac`, `blush`, `mist`, `sage`, `butter`) to avoid clobbering Tailwind's default palette.
- (agent design) Section tones: Finanzas = sage, Wishlist = blush, Ahorros = butter,
  Casa = mist, greeting/hero = lilac.
- (agent design) Semantic `text-green-700` / `text-red-600` stay (good/bad figures; 5 tests rely
  on them).
- (agent design) `/finance` (v1) is disabled: no manual restyle, it only follows the tokens.
- (agent design) Checkpoint after T2: the user validates the direction before T3–T6.

## Constraints
- Next.js 16: fonts per `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`
  (non-variable fonts need `weight`).
- Phones keep working without horizontal scroll; no behavior changes.

## Tasks
- [x] T1 — Global theme: tokens (paper, ink, pastels), fonts (Patrick Hand + `font-figure`), body background, shared components (AppNav, PageHeader gradient, Button, Input, ModalShell, MonthNav, AddButton, ProgressBar). No RED (styling only); tests 965/965, tsc, eslint 0, build green. Follow-ups: light `text-cream-100` inside PageHeader in savings, home-improvements and wishlist headers; Patrick Hand has one weight, so `font-bold` on text is faux bold (drop it on text, keep it on `font-figure`).
- [ ] T2 — Home: pastel panels, pill labels, icon circles, sticky-note greeting, `font-figure` on amounts. → CHECKPOINT with the user.
- [ ] T3 — finance-v2 screens.
- [ ] T4 — Wishlist screens and modals.
- [ ] T5 — Savings screens and modals.
- [ ] T6 — Home improvements screens and modals.
- [ ] T7 — Verify: `npm run test`, `npm run build`, `npx eslint .`, prettier.

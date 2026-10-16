# Feature: Playwright visual and layout tests

Locator: `odd/tasks/playwright-e2e.md` · Engram mirror: `odd/playwright-e2e/tasks`
Branch: `feat/playwright-e2e` (stacked on `feat/sidebar-nav`)

## Specs
- S1. "podríamos implementar playwright para testear que las cosas se vean bien" — Playwright
  tests check that pages look right, as a separate feature from the sidebar work.
- S2. Data source (user choice, verbatim): "KV en memoria (Recomendado)" — "Con E2E=1,
  shared/kv.ts usa un store en memoria con datos fijos de ejemplo. Aislado, determinista
  (capturas estables) y sin cuentas extra." E2E runs must never read or write the real
  Upstash KV, and the memory store must never activate in production (Vercel).
- S3. (agent design) Tests authenticate by setting the owner cookie for an e2e-only
  `WISHLIST_SECRET`; no real secret is used.
- S4. (agent design) Layout assertions at desktop (1280×800) and mobile (390×844): sidebar
  visible beside the content on desktop; on mobile the sidebar is hidden, the ☰ opens it as a
  drawer and selecting a section closes it; no page has horizontal overflow.
- S5. (agent design) Screenshot comparisons for Inicio, Finanzas v2 (Presupuesto, Movimientos,
  Análisis), Ahorros, Wishlist, Casa and Login at both viewports. Baselines stay stable across
  months because e2e runs freeze the server clock (`E2E_NOW`, honored only with `E2E=1`).
- S6. (agent design) Scripts `test:e2e` and `test:e2e:update`; Vitest ignores the e2e folder;
  README documents how to run and update baselines.

## Tasks
- T1. S2 · inline · in-memory KV + production guard, unit-tested · commit: 1ede4f7 (994/994 vitest)
- T2. S1, S3, S6 · inline · Playwright install, config, auth fixture, scripts, Vitest exclude · commit: 3c5f76d (smoke 4/4, user-approved)
- T3. S4 · inline · layout specs · commit: 309e178 (22 passed, 6 project-skipped; mutation check: 3 desktop specs fail when the sidebar is hidden; user-approved)
- T4. S5 · inline · screenshot specs + baselines · commit: bd76ba4 (17 passed twice in a row; user-approved)
- T4a. S4 · inline · fix found by T4: MonthNav wrapped on 390px · commit: 7e090e2 (RED "← Anterior wraps", then GREEN; user-approved)
- T5. S6 · inline · README docs · commit: pending
- V. S1-S6 · gentle-ai-verify (risk items 1 and 5: data-layer switch, new dependency) · done:
  S1-S4, S6 PASS; S5 PARTIAL. vitest 997/997, tsc clean, playwright 44 passed / 8 project-skipped.
  Open findings (await user decision): F1 screenshot tolerance 1% too loose
  (playwright.config.ts:20); F2 smoke `getByText("Audífonos")` also matches the adapter's default
  item "Audífonos W800BT Pro", so it does not prove the seed is read (confirmed by spot check);
  F3 scroll test never asserts it scrolled (layout.spec.ts:49-53); F4 viewport-only captures miss
  content below the fold (documented choice).
- T6. S2, S4, S5 · inline · fix verify findings F1-F3 (F4 kept by user decision) · commit: pending

## Log
- L1. User (2026-10-16): "podríamos implementar playwright para testear que las cosas se vean
  bien, te parece? obvio como una feature aparte"
- L2. User chose "KV en memoria (Recomendado)" for test data.
- L3. User chose "Rama propia + commits, Playwright encima (Recomendado)": sidebar work committed
  on `feat/sidebar-nav` (b0d2841, d068f3b); this branch starts from it.
- L4. Evidence: adapters only call `redis.get`, `redis.set`, `redis.mget`; auth cookie
  `wishlist_auth` = HMAC-SHA256(secret, secret) hex; `currentMonth()` uses the server clock.
- L5. Baselines are generated on Windows; CI (none today) would need its own Linux baselines.
- L6. User (2026-10-16): "recuerda que antes de cada commit quiero revisar los archivos y darte
  luz verde para seguir porque revisar todo al final es too much". Commits b0d2841, d068f3b and
  1ede4f7 were made before this request, without review; every later commit waits for approval.
- L7. User: "no veo los cambios con git diff" — new files are untracked; run `git add -N` on them
  before asking for review.
- L8. (agent design) S5 changed from masking the month label to freezing the server clock: the
  month also shows in the home finance card and in transaction dates, so masking was fragile.
  `currentMonth()` is the only server clock read that reaches the rendered pages.
- L9. User: "Si, hazlo" — fix F1-F3; F4 stays as documented.

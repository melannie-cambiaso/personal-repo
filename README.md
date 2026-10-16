This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

| Command                   | What it runs                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm test`                | Unit and component tests (Vitest, jsdom).                                |
| `npm run test:e2e`        | End-to-end tests (Playwright): layout checks and screenshot comparisons. |
| `npm run test:e2e:update` | Same, but rewrites the screenshot baselines.                             |

First time only: `npx playwright install chromium`.

**CI.** Every pull request and every push to `main` runs typecheck, lint, unit tests and the
production build on GitHub Actions (`.github/workflows/ci.yml`). End-to-end tests run only
locally: their screenshot baselines are Windows-specific.

### How the end-to-end run works

- **No real data.** Playwright builds and starts the app on port 3100 with `E2E=1`, which swaps
  Upstash for an in-memory store seeded from `e2e/fixtures/kv-seed.json`. Writes are thrown away
  when the server stops. `E2E=1` refuses to start on Vercel.
- **Logged in.** Tests set the owner cookie for an e2e-only secret; `e2e/fixtures/auth.ts`
  exports a `test` that does it. Use `@playwright/test` directly for logged-out pages.
- **Frozen clock.** The server reads `E2E_NOW` (`e2e/fixtures/clock.ts`) as "now", so pages
  always open on the same month. In the seed, `{{MONTH}}` becomes that month.
- **Two screens.** Every spec runs on `desktop` (1280×800) and `mobile` (390×844).

### When a screenshot test fails

1. Open the report: `npx playwright show-report`. It shows the expected image, the actual one
   and their diff.
2. If the change is a bug, fix the code.
3. If the change is intended, run `npm run test:e2e:update`, open the changed PNGs in
   `e2e/visual.spec.ts-snapshots/` and commit them with the change.

Baselines are named per OS (`*-win32.png`). A different OS needs its own set, generated there.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

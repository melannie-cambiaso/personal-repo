import path from "path";
import { defineConfig } from "@playwright/test";
import { E2E_SECRET } from "./e2e/fixtures/auth";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-CL",
    timezoneId: "America/Santiago",
  },
  expect: {
    // Absorbs anti-aliasing noise; a real layout change moves far more pixels.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  // A production build, like the deployed app (and without the dev-mode indicator).
  // Next 16 keeps `next dev` output in `.next/dev`, so this does not disturb a running
  // dev server. Never reuse a server: one on this port might be talking to real data.
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      E2E: "1",
      E2E_KV_SEED: path.resolve("e2e/fixtures/kv-seed.json"),
      WISHLIST_SECRET: E2E_SECRET,
      // Process env wins over `.env`, so a stray real-KV call fails instead of
      // reaching the real database.
      KV_REST_API_URL: "http://127.0.0.1:9",
      KV_REST_API_TOKEN: "e2e-invalid",
    },
  },
});

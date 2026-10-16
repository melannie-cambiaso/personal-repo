import { test as anonymous, type Page } from "@playwright/test";
import { test, expect } from "./fixtures/auth";
import { FROZEN_NOW } from "./fixtures/clock";
import { PAGES } from "./fixtures/pages";

// Baselines live in visual.spec.ts-snapshots/, one per page, project and OS. After an
// intended visual change, refresh them with `npm run test:e2e:update` and review the PNGs.
//
// Captures are viewport-sized, i.e. what a person sees on load. Full-page captures were
// tried and rejected: Playwright stretches the page to shoot it, so the fixed background
// and the sticky sidebar end at the viewport height and the baseline shows a black band
// no real screen ever shows.

async function open(page: Page, path: string) {
  await page.clock.setFixedTime(new Date(FROZEN_NOW));
  await page.goto(path);
  // Web fonts swap in after first paint; capturing before that flakes the text metrics.
  await page.evaluate(() => document.fonts.ready);
}

for (const { name, path } of PAGES) {
  test(`${name} looks as approved`, async ({ page }) => {
    await open(page, path);
    await expect(page).toHaveScreenshot(`${name}.png`);
  });
}

anonymous("login looks as approved", async ({ page }) => {
  await open(page, "/login");
  await expect(page).toHaveScreenshot("login.png");
});

test("the mobile drawer looks as approved", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "the drawer only exists on mobile");
  await open(page, "/finance-v2");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("navigation", { name: "Principal" })).toBeInViewport();
  await expect(page).toHaveScreenshot("drawer-open.png");
});

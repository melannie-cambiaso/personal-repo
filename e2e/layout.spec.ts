import { test as anonymous } from "@playwright/test";
import { test, expect } from "./fixtures/auth";
import { PAGES } from "./fixtures/pages";

const sidebar = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "Principal" });
const menuButton = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Abrir menú" });

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, "page is wider than the viewport").toBeLessThanOrEqual(0);
}

test.describe("every page", () => {
  for (const { name, path } of PAGES) {
    test(`${name} fits the viewport`, async ({ page }) => {
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    });
  }
});

anonymous("login fits the viewport and shows no app chrome", async ({ page }) => {
  await page.goto("/login");
  await expectNoHorizontalOverflow(page);
  await expect(sidebar(page)).toHaveCount(0);
  await expect(menuButton(page)).toHaveCount(0);
});

test.describe("desktop", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop layout only");
  });

  test("the sidebar is pinned to the left edge, beside the content", async ({ page }) => {
    await page.goto("/finance-v2");
    await expect(sidebar(page)).toBeVisible();
    await expect(menuButton(page)).toBeHidden();

    const nav = (await page.locator("aside").boundingBox())!;
    const main = (await page.locator("main").boundingBox())!;
    expect(nav.x).toBe(0);
    expect(main.x).toBeGreaterThanOrEqual(nav.x + nav.width);
  });

  test("the sidebar stays in view after scrolling", async ({ page }) => {
    await page.goto("/finance-v2");
    await page.mouse.wheel(0, 2000);
    await expect(sidebar(page)).toBeInViewport();
  });

  test("a section link switches the Finanzas v2 view", async ({ page }) => {
    await page.goto("/finance-v2");
    await sidebar(page).getByRole("link", { name: "Movimientos" }).click();
    await expect(page).toHaveURL(/section=movements/);
    await expect(page.getByRole("heading", { level: 1, name: "Movimientos" })).toBeVisible();
  });
});

test.describe("mobile", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile layout only");
  });

  test("the sidebar starts hidden behind the hamburger", async ({ page }) => {
    await page.goto("/finance-v2");
    await expect(menuButton(page)).toBeVisible();
    await expect(sidebar(page)).toBeHidden();
  });

  test("the hamburger opens the drawer and a section closes it", async ({ page }) => {
    await page.goto("/finance-v2");
    await menuButton(page).click();
    await expect(sidebar(page)).toBeInViewport();

    await sidebar(page).getByRole("link", { name: "Análisis" }).click();
    await expect(page).toHaveURL(/section=analysis/);
    await expect(sidebar(page)).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Análisis" })).toBeVisible();
  });

  test("tapping outside closes the drawer", async ({ page }) => {
    await page.goto("/");
    await menuButton(page).click();
    await page.getByRole("button", { name: "Cerrar menú" }).click({ position: { x: 370, y: 400 } });
    await expect(sidebar(page)).toBeHidden();
  });
});

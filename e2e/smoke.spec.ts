import { test as anonymous } from "@playwright/test";
import { test, expect } from "./fixtures/auth";

anonymous("redirects to /login without the owner cookie", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

// This title only exists in e2e/fixtures/kv-seed.json: not in the real database, and not
// in the defaults the wishlist adapter writes into an empty store. Seeing it (exactly)
// proves the app reads the seeded in-memory store.
test("serves the seeded in-memory data to the owner", async ({ page }) => {
  await page.goto("/wishlist");
  await expect(page.getByText("Audífonos de la semilla e2e", { exact: true })).toBeVisible();
});

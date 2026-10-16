import { test as anonymous } from "@playwright/test";
import { test, expect } from "./fixtures/auth";

anonymous("redirects to /login without the owner cookie", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

// The seed's high-priority wishlist item only exists in e2e/fixtures/kv-seed.json, so
// seeing it proves the app reads the in-memory store, not the real database.
test("serves the seeded in-memory data to the owner", async ({ page }) => {
  await page.goto("/wishlist");
  await expect(page.getByText("Audífonos")).toBeVisible();
});

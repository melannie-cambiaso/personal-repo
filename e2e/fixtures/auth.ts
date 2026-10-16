import { createHmac } from "crypto";
import { test as base } from "@playwright/test";

/** Owner secret the e2e server runs with (see playwright.config.ts); never a real one. */
export const E2E_SECRET = "e2e-only-secret";

// Mirrors `generateToken` in shared/auth.ts, which cannot be imported here: it pulls in
// `server-only`, which throws outside Next.js.
const ownerToken = createHmac("sha256", E2E_SECRET).update(E2E_SECRET).digest("hex");

/** `test` with the owner cookie set, for every page behind the login. */
export const test = base.extend({
  // The fixture callback is named `provide`, not Playwright's usual `use`, so React's
  // rules-of-hooks lint does not mistake it for the `use` hook.
  context: async ({ context, baseURL }, provide) => {
    await context.addCookies([{ name: "wishlist_auth", value: ownerToken, url: baseURL! }]);
    await provide(context);
  },
});

export { expect } from "@playwright/test";

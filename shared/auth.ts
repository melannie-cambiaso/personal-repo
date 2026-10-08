import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// App-wide owner session cookie. The "wishlist_" name is historical; renaming it would log out existing sessions.
export const AUTH_COOKIE = "wishlist_auth";

interface CookieReader {
  get(name: string): { value: string } | undefined;
}

export function generateToken(): string {
  const secret = process.env.WISHLIST_SECRET;
  if (!secret)
    throw new Error("WISHLIST_SECRET is not set. Add it to .env.local (dev) or Vercel env (prod).");
  return createHmac("sha256", secret).update(secret).digest("hex");
}

// Owner gate for every protected page and server action.
export function isAuthorized(cookieStore: CookieReader): boolean {
  // Checked here so a missing secret denies access instead of making generateToken throw on every page.
  if (!process.env.WISHLIST_SECRET) {
    console.error("[auth] WISHLIST_SECRET is not set: every owner check will deny access.");
    return false;
  }
  const value = cookieStore.get(AUTH_COOKIE)?.value;
  if (!value) return false;
  const expected = Buffer.from(generateToken());
  const actual = Buffer.from(value);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

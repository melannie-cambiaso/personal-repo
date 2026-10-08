import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

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

export function isAuthorized(cookieStore: CookieReader): boolean {
  const value = cookieStore.get(AUTH_COOKIE)?.value;
  if (!value || !process.env.WISHLIST_SECRET) return false;
  const expected = Buffer.from(generateToken());
  const actual = Buffer.from(value);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

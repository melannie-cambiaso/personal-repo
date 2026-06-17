import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

function expectedToken(): string {
  const secret = process.env.WISHLIST_SECRET;
  if (!secret) throw new Error("WISHLIST_SECRET is not set. Add it to .env.local (dev) or Vercel env (prod).");
  return createHmac("sha256", secret).update(secret).digest("hex");
}

export function isValidToken(token?: string): boolean {
  if (!token) return false;
  try {
    const expected = expectedToken();
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return expectedToken();
}

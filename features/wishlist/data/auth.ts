import "server-only";
import { createHmac } from "crypto";

export function generateToken(): string {
  const secret = process.env.WISHLIST_SECRET;
  if (!secret)
    throw new Error("WISHLIST_SECRET is not set. Add it to .env.local (dev) or Vercel env (prod).");
  return createHmac("sha256", secret).update(secret).digest("hex");
}

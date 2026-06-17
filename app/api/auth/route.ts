import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateToken, isValidToken } from "@/features/wishlist/data/auth";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const { searchParams } = new URL(request.url);

  if (searchParams.has("clear")) {
    cookieStore.delete("wishlist_auth");
    return NextResponse.json({ ok: true });
  }

  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  let token: string;
  try {
    token = generateToken();
  } catch {
    return NextResponse.json({ error: "WISHLIST_SECRET not configured" }, { status: 500 });
  }

  const secret = process.env.WISHLIST_SECRET!;
  if (key !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  cookieStore.set("wishlist_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const auth = request.cookies.get("wishlist_auth");
  const { pathname } = request.nextUrl;

  if (!auth?.value) {
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/wishlist/:path*", "/todo/:path*", "/login", "/"],
};

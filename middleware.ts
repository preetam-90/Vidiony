import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "./stack";

export async function middleware(request: NextRequest) {
  // Make the root route a true server-side redirect to avoid relying on
  // client-side routing (which can be interrupted by client exceptions).
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  const user = await stackServerApp.getUser({ tokenStore: request });

  if (!user) {
    return NextResponse.redirect(new URL("/handler/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/", "/dashboard"], // Apply middleware to specific routes
};

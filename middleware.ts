import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Make the root route a true server-side redirect to avoid relying on
  // client-side routing (which can be interrupted by client exceptions).
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Dashboard requires authentication - check for session cookie
  if (request.nextUrl.pathname === "/dashboard") {
    // Stack Auth uses cookies for session management
    const hasSession = request.cookies.has("stack-session") || 
                       request.cookies.has("stack-refresh");
    
    if (!hasSession) {
      return NextResponse.redirect(new URL("/handler/sign-in", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard"], // Apply middleware to specific routes
};

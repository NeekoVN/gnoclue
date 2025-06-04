import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /signin, /dashboard)
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === "/signin" || path === "/signup";

  // Get the auth token from cookies
  const authToken = request.cookies.get("auth_token")?.value;

  // If trying to access a public path (like /signin) and already authenticated,
  // redirect to home
  if (isPublicPath && authToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If trying to access a protected path and not authenticated,
  // redirect to signin
  if (!isPublicPath && !authToken) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/", "/signin", "/signup"],
}; 
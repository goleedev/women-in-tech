import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the routes that require authentication
const protectedRoutes = ['/chat', '/profile', '/notifications'];

// Define the middleware function
export function middleware(request: NextRequest) {
  // Get the pathname from the request URL
  const { pathname } = request.nextUrl;

  // Check if the pathname starts with any of the protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the pathname includes the mentorship connect action
  const isMentorshipAction = pathname.includes('/mentorship/connect');

  // Check if the pathname includes the events attend or like action
  const isEventAction =
    pathname.includes('/events') &&
    (pathname.includes('/attend') || pathname.includes('/like'));

  // Determine if authentication is needed
  const needsAuth = isProtectedRoute || isMentorshipAction || isEventAction;

  // If the request is for a public route, allow it to pass through
  if (!needsAuth) return NextResponse.next();

  // If the request is for a protected route, check for authentication
  const authToken = request.cookies.get('token')?.value;

  // If the auth token is not present, redirect to the login page
  if (!authToken)
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );

  // If the auth token is present, allow the request to pass through
  return NextResponse.next();
}

// Export the middleware configuration
export const config = {
  matcher: [
    // Protected routes
    '/chat/:path*',
    '/profile/:path*',
    '/notifications/:path*',
    // Mentorship connect action
    '/mentorship/connect/:path*',
    // Event actions
    '/events/:id/attend',
    '/events/:id/like',
  ],
};

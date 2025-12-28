import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/register'];

// A01:2021 - Broken Access Control: Validate redirect URLs to prevent open redirect
function isValidRedirectPath(path: string): boolean {
  // Only allow paths that start with / and don't contain protocol or double slashes
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return false;
  }
  // Block any path that tries to escape to a different origin
  const dangerousPatterns = ['/\\', '/%2f', '/%5c', '/..', '/.'];
  return !dangerousPatterns.some(pattern => 
    path.toLowerCase().includes(pattern)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    // A01:2021 - Only set redirect if it's a valid internal path
    if (isValidRedirectPath(pathname)) {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};

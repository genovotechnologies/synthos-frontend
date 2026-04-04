import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/admin', '/developer', '/support'];
const authRoutes = ['/login', '/register', '/forgot-password', '/verify-email', '/reset-password'];

// Role required for each route prefix
const roleRoutes: Record<string, string> = {
  '/admin': 'admin',
  '/developer': 'developer',
  '/support': 'support',
  '/dashboard': 'user',
};

// Role hierarchy levels
const roleLevel: Record<string, number> = {
  admin: 100,
  developer: 75,
  support: 50,
  user: 25,
};

function isValidRedirectPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) return false;
  const dangerousPatterns = ['/\\', '/%2f', '/%5c', '/..', '/.'];
  return !dangerousPatterns.some(p => path.toLowerCase().includes(p));
}

function getRoleFromToken(token: string): string {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.role || 'user';
  } catch {
    return 'user';
  }
}

function getDefaultRoute(role: string): string {
  const routes: Record<string, string> = {
    admin: '/admin',
    developer: '/developer',
    support: '/support',
  };
  return routes[role] || '/dashboard';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const isProtectedRoute = protectedRoutes.some(r => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    if (isValidRedirectPath(pathname)) {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to their dashboard
  if (isAuthRoute && token) {
    const role = getRoleFromToken(token);
    return NextResponse.redirect(new URL(getDefaultRoute(role), request.url));
  }

  // Role-based route guard for authenticated users
  if (isProtectedRoute && token) {
    const userRole = getRoleFromToken(token);
    const userLevel = roleLevel[userRole] || 25;

    for (const [routePrefix, requiredRole] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(routePrefix) && routePrefix !== '/dashboard') {
        const requiredLevel = roleLevel[requiredRole] || 25;
        if (userLevel < requiredLevel) {
          // User doesn't have access - redirect to their own dashboard
          return NextResponse.redirect(new URL(getDefaultRoute(userRole), request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value || '';
  const isApiRequest = request.nextUrl.pathname.startsWith('/api');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  
  // Don't redirect API routes, static files, or auth pages
  if (
    isApiRequest || 
    request.nextUrl.pathname.match(/(\.(.+))$/) ||
    isAuthPage
  ) {
    return NextResponse.next();
  }

  // Protect routes that should only be accessible to authenticated users
  const protectedPaths = ['/notes', '/profile'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/notes', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 
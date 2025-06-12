import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/authOptions'

export default auth((req) => {
  const token = req.auth
  const isAuthenticated = !!token

  // Public paths that don't require authentication
  const publicPaths = ['/', '/auth', '/auth/error']
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname)
  // Redirect authenticated users away from auth pages (but allow landing page)
  if (isAuthenticated && req.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/management', req.url))
  }

  // Redirect unauthenticated users to auth page (except for landing page)
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }
  // Role-based access control
  if (isAuthenticated && token?.user?.role) {
    const role = token.user.role as string    // Protect advisor routes
    if (req.nextUrl.pathname.startsWith('/advisor') && role !== 'ADVISOR') {
      return NextResponse.redirect(new URL('/management', req.url))
    }    // Protect chairperson routes
    if (req.nextUrl.pathname.startsWith('/chairperson') && role !== 'CHAIRPERSON') {
      return NextResponse.redirect(new URL('/management', req.url))
    }
  }

  return NextResponse.next()
})

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 
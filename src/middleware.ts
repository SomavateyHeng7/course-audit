import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

export default async function middleware(req: NextRequestWithAuth) {
  const token = await getToken({ req })
  const isAuthenticated = !!token

  // Public paths that don't require authentication
  const publicPaths = ['/', '/auth/error']
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname)

  // Redirect authenticated users away from public paths
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Role-based access control
  if (isAuthenticated) {
    const role = token.role as string

    // Protect advisor routes
    if (req.nextUrl.pathname.startsWith('/advisor') && role !== 'ADVISOR') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Protect chairperson routes
    if (req.nextUrl.pathname.startsWith('/chairperson') && role !== 'CHAIRPERSON') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

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
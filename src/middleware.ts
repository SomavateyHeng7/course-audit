import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/authOptions'

export default auth((req) => {
  const token = req.auth
  const isAuthenticated = !!token

  // Skip authentication for static files (PDF, images, etc.)
  if (req.nextUrl.pathname.match(/\.(pdf|jpg|jpeg|png|gif|svg|ico|css|js)$/i)) {
    return NextResponse.next()
  }

  // Public paths that don't require authentication
  const publicPaths = ['/', '/auth', '/auth/error', '/student', '/student/management', '/student/allCurricula', '/student/management/data-entry', 
    '/student/management/progress', '/student/management/course-planning', 
    '/student/FutureCourses', '/student/SemesterCourse']
  // Allow all /management and /allCurricula subpages to be public
  const isPublicPath = publicPaths.includes(req.nextUrl.pathname) ||
    req.nextUrl.pathname.startsWith('/student/management/data-entry') ||
    req.nextUrl.pathname.startsWith('/student/management/progress') ||
    req.nextUrl.pathname.startsWith('/student/management/course-planning') ||
    req.nextUrl.pathname.startsWith('/student/allCurricula')

  // Redirect authenticated users away from auth pages (but allow landing page)
  if (isAuthenticated && req.nextUrl.pathname === '/auth') {
    // Redirect based on user role
    if (token?.user?.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    if (token?.user?.role === 'CHAIRPERSON') {
      return NextResponse.redirect(new URL('/chairperson', req.url))
    }
    return NextResponse.redirect(new URL('/student', req.url))
  }

  // Redirect unauthenticated users to auth page (except for landing page)
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }
  
  // Role-based access control
  if (isAuthenticated && token?.user?.role) {
    const role = token.user.role as string
    
    // Protect admin routes - only SUPER_ADMIN and CHAIRPERSON can access
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (role !== 'SUPER_ADMIN' && role !== 'CHAIRPERSON') {
        return NextResponse.redirect(new URL('/management', req.url))
      }
    }
    
    // Chairperson restrictions - allow chairperson routes, profile, and admin
    if (role === 'CHAIRPERSON') {
      const isChairpersonRoute = req.nextUrl.pathname.startsWith('/chairperson')
      const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
      const isProfileRoute = req.nextUrl.pathname === '/profile'
      const isHomeRoute = req.nextUrl.pathname === '/home'
      const isAllowedRoute = isChairpersonRoute || isAdminRoute || isProfileRoute || isPublicPath
      
      // Redirect chairpersons from /home to /chairperson
      if (isHomeRoute) {
        return NextResponse.redirect(new URL('/chairperson', req.url))
      }
        
      if (!isAllowedRoute) {
        return NextResponse.redirect(new URL('/chairperson', req.url))
      }
    }
    
    // SUPER_ADMIN access - can access everything except being redirected from /home
    if (role === 'SUPER_ADMIN') {
      // Redirect super admins from /home to /admin
      if (req.nextUrl.pathname === '/home') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }
    
    // Protect advisor routes
    if (req.nextUrl.pathname.startsWith('/advisor') && role !== 'ADVISOR') {
      if (role === 'CHAIRPERSON') {
        return NextResponse.redirect(new URL('/chairperson', req.url))
      }
      if (role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/management', req.url))
    }
    
    // Protect chairperson routes
    if (req.nextUrl.pathname.startsWith('/chairperson') && role !== 'CHAIRPERSON' && role !== 'SUPER_ADMIN') {
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
     * - PDF files
     * - static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.pdf$|.*\\.jpg$|.*\\.jpeg$|.*\\.png$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.css$|.*\\.js$).*)',
  ],
} 
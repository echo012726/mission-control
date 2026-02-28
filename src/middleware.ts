import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow public paths
  if (
    request.nextUrl.pathname.startsWith('/api/auth/login') ||
    request.nextUrl.pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // Check session cookie for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const session = request.cookies.get('mc_session')
    if (!session || session.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Check session cookie for pages
  if (!request.nextUrl.pathname.startsWith('/api/') && request.nextUrl.pathname !== '/login') {
    const session = request.cookies.get('mc_session')
    if (!session || session.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_TOKENS = ['mc_dev_token_2024', 'marcus2026']
const PORTAL_SECRET = 'marcus2026'

// SECURITY: Always require auth (no dev bypass)
// isDev removed - always enforce auth

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl


  // Allow static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Allow login page
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Allow portal with secret
  if (pathname === '/portal') {
    const secret = request.nextUrl.searchParams.get('s')
    if (secret === PORTAL_SECRET) {
      const response = NextResponse.next()
      response.cookies.set('mc_token', 'authenticated', {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      return response
    }
    return NextResponse.redirect(new URL('/login?error=invalid_secret', request.url))
  }

  // Check token
  const queryToken = request.nextUrl.searchParams.get('token')
  const cookieToken = request.cookies.get('mc_token')?.value
  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '')

  const validToken = queryToken || cookieToken || authHeader

  if (!validToken || !ALLOWED_TOKENS.includes(validToken)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login?error=token_required', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

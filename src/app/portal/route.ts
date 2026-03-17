import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('s')
  
  if (secret !== 'marcus2026') {
    return NextResponse.redirect(new URL('/login?error=invalid_secret', request.url))
  }
  
  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_URL || 'http://localhost:3456'))
  
  response.cookies.set('mc_token', 'authenticated', {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  
  return response
}

import { cookies, headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const SESSION_COOKIE = 'mc_session'
const MISSION_CONTROL_TOKEN = process.env.MISSION_CONTROL_TOKEN!

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10)
}

export async function verifyToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash)
}

export async function createSession() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<boolean> {
  // In development mode, allow all requests without authentication
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  // Check cookie
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  if (session?.value === 'authenticated') return true

  // Check Authorization header
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    return token === MISSION_CONTROL_TOKEN
  }

  // Allow requests from localhost/127.0.0.1 for development (no auth needed)
  const origin = headerStore.get('origin')
  const referer = headerStore.get('referer')
  const host = headerStore.get('host')
  
  if (
    origin === 'http://localhost:3456' ||
    origin === 'http://127.0.0.1:3456' ||
    referer?.includes('localhost:3456') ||
    referer?.includes('127.0.0.1:3456') ||
    host === 'localhost:3456' ||
    host === '127.0.0.1:3456'
  ) {
    return true
  }

  return false
}

export async function login(token: string): Promise<boolean> {
  // Simple token verification against env var
  if (token === MISSION_CONTROL_TOKEN) {
    await createSession()
    await logActivity('login', { method: 'token' })
    return true
  }
  return false
}

export async function logActivity(type: string, payload: Record<string, unknown>) {
  try {
    await prisma.activityLog.create({
      data: {
        type,
        payload: JSON.stringify(payload),
      },
    })
  } catch (e) {
    console.error('Failed to log activity', e)
  }
}

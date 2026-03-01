import { NextRequest } from 'next/server'
import { GET, broadcastEvent, getClientCount } from '@/lib/sse-server'

export { GET, broadcastEvent, getClientCount }
export const dynamic = 'force-dynamic'

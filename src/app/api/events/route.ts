import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Store active connections for SSE
const clients = new Set<ReadableStreamDefaultController>()

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller)
      
      // Send initial connection message
      controller.enqueue(encoder.encode(`event: connected\ndata: {"status":"connected"}\n\n`))

      // Heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: {"time":${Date.now()}}\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clients.delete(controller)
        try {
          controller.close()
        } catch {}
      })
    },
    cancel() {
      // Client disconnected
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// Function to broadcast events to all connected clients
export function broadcastEvent(event: string, data: unknown) {
  const encoder = new TextEncoder()
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  
  for (const controller of clients) {
    try {
      controller.enqueue(encoder.encode(message))
    } catch {
      clients.delete(controller)
    }
  }
}

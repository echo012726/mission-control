'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

type EventCallback = (data: unknown) => void

interface UseSSEOptions {
  onTaskCreated?: EventCallback
  onTaskUpdated?: EventCallback
  onTaskDeleted?: EventCallback
  onAgentUpdate?: EventCallback
  onActivity?: EventCallback
}

export function useSSE(options: UseSSEOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const [connected, setConnected] = useState(false)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource('/api/events')
    eventSourceRef.current = eventSource

    eventSource.addEventListener('connected', () => {
      setConnected(true)
    })

    eventSource.addEventListener('task_created', (event) => {
      try {
        const data = JSON.parse(event.data)
        options.onTaskCreated?.(data)
      } catch (e) {
        console.error('Failed to parse task_created event', e)
      }
    })

    eventSource.addEventListener('task_updated', (event) => {
      try {
        const data = JSON.parse(event.data)
        options.onTaskUpdated?.(data)
      } catch (e) {
        console.error('Failed to parse task_updated event', e)
      }
    })

    eventSource.addEventListener('task_deleted', (event) => {
      try {
        const data = JSON.parse(event.data)
        options.onTaskDeleted?.(data)
      } catch (e) {
        console.error('Failed to parse task_deleted event', e)
      }
    })

    eventSource.addEventListener('agent_update', (event) => {
      try {
        const data = JSON.parse(event.data)
        options.onAgentUpdate?.(data)
      } catch (e) {
        console.error('Failed to parse agent_update event', e)
      }
    })

    eventSource.addEventListener('activity', (event) => {
      try {
        const data = JSON.parse(event.data)
        options.onActivity?.(data)
      } catch (e) {
        console.error('Failed to parse activity event', e)
      }
    })

    eventSource.onerror = () => {
      setConnected(false)
      eventSource.close()
      
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 3000)
    }
  }, [options])

  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  return { connected }
}

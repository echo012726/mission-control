// Shared broadcast mechanism for Server-Sent Events
// In production with multiple instances, this would use Redis

type EventCallback = (data: unknown) => void

class EventBroadcaster {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  subscribe(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  broadcast(event: string, data: unknown) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }
}

// Singleton instance
export const eventBroadcaster = new EventBroadcaster()

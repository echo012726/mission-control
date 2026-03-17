import { useState, useEffect, useCallback } from 'react'

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface NotificationSettings {
  enabled: boolean
  dueDateReminders: boolean
  assignedTasks: boolean
  mentions: boolean
  dailyDigest: boolean
  subscription: PushSubscription | null
}

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

export function usePushNotifications() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [error, setError] = useState<string | null>(null)

  // Check current permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Fetch settings from server
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (err) {
      console.error('Failed to fetch notification settings:', err)
      setError('Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Push notifications not supported')
      return null
    }

    try {
      // Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setError('Notification permission denied')
        return null
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer
      })

      // Save subscription to server
      const subscriptionObj = subscription.toJSON()
      
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscriptionObj,
          enabled: true
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        setError(null)
        return subscriptionObj as unknown as PushSubscription
      } else {
        throw new Error('Failed to save subscription')
      }
    } catch (err) {
      console.error('Failed to subscribe:', err)
      setError('Failed to enable notifications')
      return null
    }
  }, [])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      // Update server
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: null,
          enabled: false
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }

      return true
    } catch (err) {
      console.error('Failed to unsubscribe:', err)
      setError('Failed to disable notifications')
      return false
    }
  }, [])

  // Update notification preferences
  const updateSettings = useCallback(async (prefs: Partial<NotificationSettings>) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to update settings:', err)
      return false
    }
  }, [])

  // Test notification
  const sendTestNotification = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST'
      })
      return res.ok
    } catch {
      return false
    }
  }, [])

  return {
    settings,
    loading,
    permission,
    error,
    subscribe,
    unsubscribe,
    updateSettings,
    sendTestNotification,
    refresh: fetchSettings
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray as unknown as Uint8Array
}

export default usePushNotifications

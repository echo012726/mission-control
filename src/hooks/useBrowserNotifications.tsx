'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface NotificationPermissionState {
  granted: boolean
  denied: boolean
  default: boolean
}

interface DueTask {
  id: string
  title: string
  dueDate: string | null
  priority: string
}

interface NotificationState {
  permission: NotificationPermissionState
  enabled: boolean
  notifiedTasks: Set<string>
}

// Helper to convert Notification.permission to our type
function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, denied: false, default: true }
  }
  const perm = Notification.permission
  return {
    granted: perm === 'granted',
    denied: perm === 'denied',
    default: perm === 'default'
  }
}

// Track notified tasks to avoid duplicate notifications
const notifiedTasksCache = new Set<string>()

export function useBrowserNotifications(enabled: boolean = true) {
  const [state, setState] = useState<NotificationState>({
    permission: getNotificationPermission(),
    enabled,
    notifiedTasks: notifiedTasksCache,
  })
  const lastCheckRef = useRef<number>(0)

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Browser notifications not supported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setState(prev => ({
        ...prev,
        permission: {
          granted: permission === 'granted',
          denied: permission === 'denied',
          default: permission === 'default',
        },
      }))
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [])

  const sendNotification = useCallback((title: string, body: string, icon?: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'mission-control-reminder',
          requireInteraction: false,
        })
      } catch (error) {
        console.error('Error sending notification:', error)
      }
    }
  }, [])

  const checkAndNotify = useCallback(async () => {
    if (!enabled || state.permission.granted === false) {
      return
    }

    // Rate limit - only check once per minute
    const now = Date.now()
    if (now - lastCheckRef.current < 60000) {
      return
    }
    lastCheckRef.current = now

    try {
      const response = await fetch('/api/tasks/overdue')
      const data = await response.json()

      if (data.overdue && data.overdue.length > 0) {
        // Notify about overdue tasks
        const newOverdue = data.overdue.filter(
          (task: DueTask) => !notifiedTasksCache.has(task.id)
        )

        newOverdue.forEach((task: DueTask) => {
          const priorityLabel = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '⚪'
          sendNotification(
            '⚠️ Task Overdue!',
            `${priorityLabel} ${task.title}`,
          )
          notifiedTasksCache.add(task.id)
        })

        if (newOverdue.length > 0) {
          setState(prev => ({
            ...prev,
            notifiedTasks: new Set(notifiedTasksCache),
          }))
        }
      }

      // Check for tasks due today that we haven't notified about
      if (data.dueToday && data.dueToday.length > 0) {
        const newDueToday = data.dueToday.filter(
          (task: DueTask) => !notifiedTasksCache.has(`today-${task.id}`)
        )

        newDueToday.forEach((task: DueTask) => {
          const priorityLabel = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '⚪'
          sendNotification(
            '📅 Due Today',
            `${priorityLabel} ${task.title}`,
          )
          notifiedTasksCache.add(`today-${task.id}`)
        })

        if (newDueToday.length > 0) {
          setState(prev => ({
            ...prev,
            notifiedTasks: new Set(notifiedTasksCache),
          }))
        }
      }
    } catch (error) {
      console.error('Error checking for due tasks:', error)
    }
  }, [enabled, state.permission.granted, sendNotification])

  // Request permission on mount if enabled
  useEffect(() => {
    if (enabled && state.permission.default && typeof window !== 'undefined' && 'Notification' in window) {
      // Auto-request permission on first visit (browsers may block this without user interaction)
      // Instead, we'll wait for user to click enable
    }
  }, [enabled, state.permission.default])

  // Check for due tasks periodically (every 5 minutes)
  useEffect(() => {
    if (!enabled || !state.permission.granted) {
      return
    }

    // Initial check after 10 seconds (give time for page to load)
    const initialTimeout = setTimeout(() => {
      checkAndNotify()
    }, 10000)

    // Then check every 5 minutes
    const interval = setInterval(checkAndNotify, 5 * 60 * 1000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [enabled, state.permission.granted, checkAndNotify])

  return {
    permission: state.permission,
    enabled: state.enabled,
    requestPermission,
    checkAndNotify,
    notifiedCount: state.notifiedTasks.size,
  }
}

// Settings component for notification controls
export function NotificationSettings({ onClose }: { onClose: () => void }) {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    getNotificationPermission()
  )
  const [enabled, setEnabled] = useState(true)

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser notifications are not supported in this browser')
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission({
        granted: result === 'granted',
        denied: result === 'denied',
        default: result === 'default',
      })
    } catch (error) {
      console.error('Error requesting permission:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            Notification Settings
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Permission Status */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Browser Permission
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                permission.granted 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : permission.denied
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
              }`}>
                {permission.granted ? 'Allowed' : permission.denied ? 'Blocked' : 'Not Set'}
              </span>
            </div>
          </div>

          {/* Request Permission Button */}
          {permission.default && (
            <button
              onClick={handleRequestPermission}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Enable Browser Notifications
            </button>
          )}

          {/* Permission Denied Help */}
          {permission.denied && (
            <p className="text-sm text-red-500">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}

          {/* Enable/Disable Toggle */}
          {permission.granted && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Enable Reminders
              </span>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  enabled ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-400">
            You&apos;ll receive notifications when tasks become overdue or are due today.
            Checks run every 5 minutes while the app is open.
          </p>
        </div>
      </div>
    </div>
  )
}

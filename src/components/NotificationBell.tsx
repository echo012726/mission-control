'use client'

import { useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [showPanel, setShowPanel] = useState(false)
  const {
    settings,
    loading,
    permission,
    error,
    subscribe,
    unsubscribe,
    updateSettings,
    sendTestNotification
  } = usePushNotifications()

  const handleToggle = async () => {
    if (!settings?.enabled) {
      await subscribe()
    } else {
      await unsubscribe()
    }
  }

  const handleTest = async () => {
    await sendTestNotification()
  }

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`p-2 rounded-lg transition-colors ${
          settings?.enabled 
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}
        title={settings?.enabled ? 'Notifications enabled' : 'Notifications disabled'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {settings?.enabled && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Push Notifications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {permission === 'granted' 
                ? 'Notifications are enabled' 
                : permission === 'denied' 
                  ? 'Notifications blocked in browser settings'
                  : 'Enable to receive task reminders'}
            </p>
          </div>

          <div className="p-4 space-y-4">
            {error && (
              <div className="p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Enable Notifications</span>
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings?.enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings?.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {settings?.enabled && (
              <>
                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Due Date Reminders</span>
                    <input
                      type="checkbox"
                      checked={settings.dueDateReminders}
                      onChange={(e) => updateSettings({ dueDateReminders: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Assigned Tasks</span>
                    <input
                      type="checkbox"
                      checked={settings.assignedTasks}
                      onChange={(e) => updateSettings({ assignedTasks: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Mentions</span>
                    <input
                      type="checkbox"
                      checked={settings.mentions}
                      onChange={(e) => updateSettings({ mentions: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Daily Digest</span>
                    <input
                      type="checkbox"
                      checked={settings.dailyDigest}
                      onChange={(e) => updateSettings({ dailyDigest: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleTest}
                  className="w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                  Send Test Notification
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell

'use client';

import { useState, useEffect } from 'react';

interface NotificationSettings {
  enabled: boolean;
  dueDateReminders: boolean;
  assignedTasks: boolean;
  mentions: boolean;
  dailyDigest: boolean;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    dueDateReminders: true,
    assignedTasks: true,
    mentions: true,
    dailyDigest: false
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [vapidPublicKey, setVapidPublicKey] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/notifications/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings({
          enabled: data.settings.enabled,
          dueDateReminders: data.settings.dueDateReminders,
          assignedTasks: data.settings.assignedTasks,
          mentions: data.settings.mentions,
          dailyDigest: data.settings.dailyDigest
        });
      }
      if (data.vapidPublicKey) {
        setVapidPublicKey(data.vapidPublicKey);
      }
      if (data.subscriptions && data.subscriptions.length > 0) {
        setSubscription(data.subscriptions[0]);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage('Settings saved!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setMessage('Push notifications not supported in this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setMessage('Notification permission denied');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subscriptionData = {
        endpoint: sub.endpoint,
        p256dh: sub.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))) : '',
        auth: sub.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))) : '',
        userAgent: navigator.userAgent
      };

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      if (res.ok) {
        setSettings(prev => ({ ...prev, enabled: true }));
        setMessage('Successfully subscribed to push notifications!');
        fetchSettings();
      } else {
        setMessage('Failed to subscribe');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setMessage('Error subscribing to push notifications');
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    try {
      const endpoint = new URLSearchParams();
      endpoint.set('endpoint', subscription.endpoint);

      await fetch(`/api/notifications/subscribe?${endpoint}`, {
        method: 'DELETE'
      });

      setSettings(prev => ({ ...prev, enabled: false }));
      setSubscription(null);
      setMessage('Unsubscribed from push notifications');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setMessage('Error unsubscribing');
    }
  };

  const sendTestNotification = async () => {
    try {
      const res = await fetch('/api/notifications/send', { method: 'GET' });
      const data = await res.json();
      setMessage(data.message || 'Test notification sent');
    } catch (error) {
      console.error('Error sending test:', error);
      setMessage('Failed to send test notification');
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        🔔 Push Notifications
      </h3>

      {!subscription && (
        <button
          onClick={subscribe}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Enable Push Notifications
        </button>
      )}

      {subscription && (
        <>
          <div className="flex items-center justify-between p-3 bg-green-900/30 rounded-lg border border-green-700">
            <span className="text-green-400 text-sm">✓ Push notifications enabled</span>
            <button
              onClick={unsubscribe}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Disable
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 text-gray-300">
              <input
                type="checkbox"
                checked={settings.dueDateReminders}
                onChange={(e) => setSettings(prev => ({ ...prev, dueDateReminders: e.target.checked }))}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              Due date reminders
            </label>

            <label className="flex items-center gap-3 text-gray-300">
              <input
                type="checkbox"
                checked={settings.assignedTasks}
                onChange={(e) => setSettings(prev => ({ ...prev, assignedTasks: e.target.checked }))}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              Task assignment notifications
            </label>

            <label className="flex items-center gap-3 text-gray-300">
              <input
                type="checkbox"
                checked={settings.mentions}
                onChange={(e) => setSettings(prev => ({ ...prev, mentions: e.target.checked }))}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              Team mentions
            </label>

            <label className="flex items-center gap-3 text-gray-300">
              <input
                type="checkbox"
                checked={settings.dailyDigest}
                onChange={(e) => setSettings(prev => ({ ...prev, dailyDigest: e.target.checked }))}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              Daily digest
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={sendTestNotification}
              className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Test
            </button>
          </div>
        </>
      )}

      {message && (
        <p className={`text-sm ${message.includes('Failed') || message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

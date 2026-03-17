'use client'
import { useState, useEffect } from 'react'
import { MessageSquare, Hash, Bell, BellOff, Send, Plus, Check, Loader2, ExternalLink } from 'lucide-react'

type Channel = {
  id: string
  name: string
  events: string[]
}

type SlackStatus = {
  connected: boolean
  teamName?: string
  channelName?: string
  notifications?: boolean
}

export default function SlackIntegration() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newChannel, setNewChannel] = useState('')
  const [teamName, setTeamName] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [error, setError] = useState('')

  // Check connection status on mount
  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/slack?action=status')
      const data = await res.json()
      
      if (data.connected) {
        setConnected(true)
        setTeamName(data.teamName || '')
        setNotifications(data.notifications !== false)
        
        // Fetch channels
        const channelsRes = await fetch('/api/slack?action=channels')
        const channelsData = await channelsRes.json()
        if (channelsData.channels?.length > 0) {
          setChannels(channelsData.channels.map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            events: ['task.completed']
          })))
        }
      }
    } catch (err) {
      console.error('Failed to check Slack status:', err)
    } finally {
      setLoading(false)
    }
  }

  const connectSlack = async () => {
    try {
      setConnecting(true)
      setError('')
      
      // Get OAuth URL
      const res = await fetch('/api/slack?action=auth')
      const data = await res.json()
      
      if (data.authUrl) {
        // Redirect to Slack
        window.location.href = data.authUrl
      } else if (data.error) {
        setError(data.error + ' - Add SLACK_CLIENT_ID to .env')
        setConnecting(false)
      }
    } catch (err) {
      setError('Failed to initiate OAuth')
      setConnecting(false)
    }
  }

  const disconnectSlack = async () => {
    try {
      await fetch('/api/slack?action=disconnect', { method: 'POST' })
      setConnected(false)
      setTeamName('')
      setChannels([])
    } catch (err) {
      console.error('Failed to disconnect:', err)
    }
  }

  const toggleNotifications = async () => {
    try {
      await fetch('/api/slack?action=settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: !notifications })
      })
      setNotifications(!notifications)
    } catch (err) {
      console.error('Failed to update settings:', err)
    }
  }

  const sendTestNotification = async () => {
    try {
      await fetch('/api/slack?action=notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '🔔 Test notification from Mission Control!' })
      })
    } catch (err) {
      console.error('Failed to send notification:', err)
    }
  }

  const addChannel = () => {
    if (newChannel) {
      setChannels([...channels, { id: Date.now().toString(), name: newChannel, events: ['task.completed'] }])
      setNewChannel('')
      setShowAdd(false)
    }
  }

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    
    if (code) {
      // Exchange code for token
      fetch(`/api/slack?action=callback&code=${code}`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setConnected(true)
            setTeamName(data.teamName || '')
          } else {
            setError(data.error || 'OAuth failed')
          }
          // Clean URL
          window.history.replaceState({}, '', '/settings')
          checkStatus()
        })
        .catch(err => {
          setError('OAuth callback failed')
          window.history.replaceState({}, '', '/settings')
        })
    } else if (error) {
      setError(error)
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="text-gray-500">Loading Slack status...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium">Slack Integration</h3>
            <p className="text-sm text-gray-500">
              {connected ? `Connected to ${teamName}` : 'Post task updates to channels'}
            </p>
          </div>
        </div>
        
        {error && (
          <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
            {error}
          </div>
        )}
        
        <button 
          onClick={connected ? disconnectSlack : connectSlack}
          disabled={connecting}
          className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
            connected 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {connecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : connected ? (
            <>Disconnect</>
          ) : (
            <><Plus className="w-4 h-4" /> Connect</>
          )}
        </button>
      </div>

      {connected && (
        <div className="space-y-4">
          {/* Notification Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2">
              {notifications ? (
                <Bell className="w-4 h-4 text-green-500" />
              ) : (
                <BellOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm">Task Notifications</span>
            </div>
            <button
              onClick={toggleNotifications}
              className={`w-10 h-5 rounded-full transition-colors ${
                notifications ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                notifications ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Test Notification Button */}
          <button
            onClick={sendTestNotification}
            className="w-full py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Send Test Notification
          </button>

          {/* Channels Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Notification Channels</span>
              <button onClick={() => setShowAdd(true)} className="ml-auto p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {showAdd && (
              <div className="flex gap-2">
                <input 
                  value={newChannel} 
                  onChange={e => setNewChannel(e.target.value)} 
                  placeholder="#channel-name" 
                  className="flex-1 p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600" 
                />
                <button onClick={addChannel} className="px-3 bg-blue-600 text-white rounded text-sm">Add</button>
              </div>
            )}

            {channels.length === 0 && !showAdd && (
              <p className="text-sm text-gray-500 text-center py-2">
                No channels configured. Add a channel to receive notifications.
              </p>
            )}

            {channels.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <span className="text-sm font-mono">#{c.name}</span>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500">{c.events[0]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
            <p>Events sent to Slack:</p>
            <ul className="mt-1 space-y-1">
              <li>• Task completed</li>
              <li>• Task assigned</li>
              <li>• Due date reminder</li>
            </ul>
          </div>
        </div>
      )}

      {!connected && !loading && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">
            Connect Slack to receive notifications when tasks are completed, assigned, or due.
          </p>
          <button
            onClick={connectSlack}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Connect to Slack
          </button>
        </div>
      )}
    </div>
  )
}

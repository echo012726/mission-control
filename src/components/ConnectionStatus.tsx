'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import { useSSE } from '@/lib/useSSE'

interface ConnectionStatusProps {
  compact?: boolean
}

export default function ConnectionStatus({ compact = false }: ConnectionStatusProps) {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  const { connected } = useSSE({
    onTaskCreated: () => {},
    onTaskUpdated: () => {},
    onTaskDeleted: () => {},
    onAgentUpdate: () => {},
    onActivity: () => {},
  })

  useEffect(() => {
    if (connected) {
      setConnectionState('connected')
      setReconnectAttempt(0)
    } else {
      setConnectionState('disconnected')
    }
  }, [connected])

  // Auto-reconnect logic with exponential backoff
  useEffect(() => {
    if (connectionState === 'disconnected') {
      const maxAttempts = 5
      const baseDelay = 2000 // 2 seconds
      
      if (reconnectAttempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, reconnectAttempt)
        const timeout = setTimeout(() => {
          setReconnectAttempt(prev => prev + 1)
          // Force reconnection by triggering a re-render
          setConnectionState('connecting')
        }, delay)
        
        return () => clearTimeout(timeout)
      } else {
        setConnectionState('error')
      }
    }
  }, [connectionState, reconnectAttempt])

  const handleManualReconnect = useCallback(() => {
    setReconnectAttempt(0)
    setConnectionState('connecting')
  }, [])

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {connectionState === 'connected' && (
          <div className="flex items-center gap-1.5 text-green-400">
            <div className="live-dot" />
            <span className="text-xs">Live</span>
          </div>
        )}
        {connectionState === 'disconnected' && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <WifiOff size={14} />
          </div>
        )}
        {connectionState === 'connecting' && (
          <div className="flex items-center gap-1.5 text-yellow-400">
            <RefreshCw size={14} className="animate-spin" />
          </div>
        )}
        {connectionState === 'error' && (
          <button
            onClick={handleManualReconnect}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300"
          >
            <AlertCircle size={14} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-white/5">
      {connectionState === 'connected' && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Wifi size={16} className="text-green-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <span className="text-sm text-green-400 font-medium">Connected</span>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400/70">Real-time</span>
          </div>
        </div>
      )}

      {connectionState === 'disconnected' && (
        <div className="flex items-center gap-2">
          <WifiOff size={16} className="text-gray-500" />
          <span className="text-sm text-gray-500">Disconnected</span>
          <span className="text-xs text-gray-600">Reconnecting...</span>
        </div>
      )}

      {connectionState === 'connecting' && (
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-yellow-400 animate-spin" />
          <span className="text-sm text-yellow-400">Connecting...</span>
        </div>
      )}

      {connectionState === 'error' && (
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-sm text-red-400">Connection failed</span>
          <button
            onClick={handleManualReconnect}
            className="ml-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {reconnectAttempt > 0 && connectionState !== 'error' && (
        <span className="text-xs text-gray-600 ml-2">
          Attempt {reconnectAttempt}/5
        </span>
      )}
    </div>
  )
}

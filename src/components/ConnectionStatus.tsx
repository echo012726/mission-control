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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {connectionState === 'connected' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Live</span>
          </div>
        )}
        {connectionState === 'disconnected' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
            <WifiOff size={14} />
          </div>
        )}
        {connectionState === 'connecting' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#eab308' }}>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
        {connectionState === 'error' && (
          <button
            onClick={handleManualReconnect}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <AlertCircle size={14} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '8px 16px', 
      borderRadius: '8px',
      background: connectionState === 'connected' ? '#f0fdf4' : '#f1f5f9',
      border: `1px solid ${connectionState === 'connected' ? '#bbf7d0' : '#e2e8f0'}`
    }}>
      {connectionState === 'connected' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wifi size={16} color="#16a34a" />
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#15803d' }}>Connected</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: '12px', color: '#15803d' }}>Real-time</span>
          </span>
        </div>
      )}

      {connectionState === 'disconnected' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WifiOff size={16} color="#94a3b8" />
          <span style={{ fontSize: '14px', color: '#64748b' }}>Disconnected</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Reconnecting...</span>
        </div>
      )}

      {connectionState === 'connecting' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} color="#eab308" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px', color: '#ca8a04' }}>Connecting...</span>
        </div>
      )}

      {connectionState === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} color="#ef4444" />
          <span style={{ fontSize: '14px', color: '#dc2626' }}>Connection failed</span>
          <button
            onClick={handleManualReconnect}
            style={{ 
              marginLeft: '8px', 
              fontSize: '12px', 
              padding: '4px 8px',
              background: '#fee2e2', 
              color: '#dc2626',
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {reconnectAttempt > 0 && connectionState !== 'error' && (
        <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
          Attempt {reconnectAttempt}/5
        </span>
      )}
    </div>
  )
}

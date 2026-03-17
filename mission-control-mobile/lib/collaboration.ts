// Mission Control Mobile - Real-Time Collaboration Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { api, Task } from './api';

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Change {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_deleted';
  taskId: string;
  task?: Task;
  timestamp: number;
}

export interface CollaborationState {
  connected: boolean;
  roomId: string | null;
  activeUsers: User[];
  pendingChanges: Change[];
}

// WebSocket event types
export const WS_EVENTS = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  TYPING: 'typing',
  ROOM_JOIN: 'room_join',
  ROOM_LEAVE: 'room_leave',
};

// Mock WebSocket server URL (configurable)
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8080';

export const useCollaboration = (roomId: string = 'default-room') => {
  const [state, setState] = useState<CollaborationState>({
    connected: false,
    roomId: null,
    activeUsers: [],
    pendingChanges: [],
  });
  
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Simulated active users for demo (in production, this comes from WebSocket)
  const mockUsers: User[] = [
    { id: '1', name: 'Marcus', avatar: '👤' },
    { id: '2', name: 'Alex', avatar: '🤖' },
  ];

  const connect = useCallback(() => {
    // For demo purposes, we'll simulate the connection
    // In production, uncomment the WebSocket code below
    
    /*
    try {
      const ws = new WebSocket(`${WS_URL}?room=${roomId}&token=mock-token`);
      
      ws.onopen = () => {
        setState(prev => ({ ...prev, connected: true, roomId }));
        reconnectAttempts.current = 0;
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
      };
      
      ws.onclose = () => {
        setState(prev => ({ ...prev, connected: false }));
        attemptReconnect();
      };
      
      ws.onerror = () => {
        ws.close();
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.log('WebSocket connection failed, running in offline mode');
      setState(prev => ({ ...prev, connected: false }));
    }
    */

    // Simulate connection for demo
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        connected: true,
        roomId,
        activeUsers: mockUsers.slice(0, Math.floor(Math.random() * 2) + 1),
      }));
    }, 500);
  }, [roomId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setState(prev => ({ ...prev, connected: false, roomId: null }));
  }, []);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current++;
        connect();
      }, delay);
    }
  }, [connect]);

  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case WS_EVENTS.USER_JOINED:
        setState(prev => ({
          ...prev,
          activeUsers: [...prev.activeUsers, data.user],
        }));
        break;
      case WS_EVENTS.USER_LEFT:
        setState(prev => ({
          ...prev,
          activeUsers: prev.activeUsers.filter(u => u.id !== data.userId),
        }));
        break;
      case WS_EVENTS.TYPING:
        setTypingUsers(prev => {
          if (data.isTyping) {
            return prev.includes(data.userId) ? prev : [...prev, data.userId];
          }
          return prev.filter(id => id !== data.userId);
        });
        break;
      case WS_EVENTS.TASK_CREATED:
      case WS_EVENTS.TASK_UPDATED:
      case WS_EVENTS.TASK_DELETED:
        // These are handled by the parent component via callbacks
        break;
    }
  }, []);

  const emitChange = useCallback((change: Change) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(change));
    } else {
      // Queue for later when connection is restored
      setState(prev => ({
        ...prev,
        pendingChanges: [...prev.pendingChanges, change],
      }));
    }
  }, []);

  const flushPendingChanges = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && state.pendingChanges.length > 0) {
      state.pendingChanges.forEach(change => {
        wsRef.current?.send(JSON.stringify(change));
      });
      setState(prev => ({ ...prev, pendingChanges: [] }));
    }
  }, [state.pendingChanges]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: WS_EVENTS.TYPING,
        isTyping,
      }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    typingUsers,
    connect,
    disconnect,
    emitChange,
    flushPendingChanges,
    sendTyping,
  };
};

export default useCollaboration;

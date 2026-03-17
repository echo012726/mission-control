'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getPusherClient, CHANNELS, EVENTS } from '@/lib/pusher';
import Pusher from 'pusher-js';

interface RealTimeContextType {
  isConnected: boolean;
  subscribe: (channel: string, events: string[], callback: (data: any) => void) => () => void;
}

const RealTimeContext = createContext<RealTimeContextType>({
  isConnected: false,
  subscribe: () => () => {},
});

export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [subscriptions, setSubscriptions] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    // Initialize Pusher client
    try {
      const pusherInstance = getPusherClient();
      if (!pusherInstance) {
        console.log('Pusher not configured, real-time updates disabled');
        return;
      }
      
      setPusher(pusherInstance);

      pusherInstance.connection.bind('connected', () => {
        setIsConnected(true);
      });

      pusherInstance.connection.bind('disconnected', () => {
        setIsConnected(false);
      });

      return () => {
        pusherInstance.disconnect();
      };
    } catch (error) {
      console.error('Failed to initialize Pusher:', error);
    }
  }, []);

  const subscribe = useCallback((channelName: string, events: string[], callback: (data: any) => void) => {
    if (!pusher) return () => {};

    const channel = pusher.subscribe(channelName);
    
    events.forEach((event) => {
      channel.bind(event, callback);
    });

    const subscriptionKey = `${channelName}-${events.join('-')}`;
    
    setSubscriptions((prev) => {
      const newMap = new Map(prev);
      newMap.set(subscriptionKey, { channel, events, callback });
      return newMap;
    });

    // Return unsubscribe function
    return () => {
      events.forEach((event) => {
        channel.unbind(event, callback);
      });
      pusher.unsubscribe(channelName);
    };
  }, [pusher]);

  return (
    <RealTimeContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  return useContext(RealTimeContext);
}

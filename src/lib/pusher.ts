import Pusher from 'pusher-js';
import PusherServer from 'pusher';

// Check if Pusher is configured
export const isPusherConfigured = !!(
  process.env.PUSHER_APP_ID && 
  process.env.PUSHER_SECRET && 
  process.env.NEXT_PUBLIC_PUSHER_KEY
);

// Server-side Pusher instance
export const pusherServer = isPusherConfigured ? new PusherServer({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  useTLS: true,
}) : null;

// Client-side Pusher instance singleton
let clientPusher: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (!isPusherConfigured) return null;
  
  if (!clientPusher) {
    clientPusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    });
  }
  return clientPusher;
}

// Channel names
export const CHANNELS = {
  TASKS: 'tasks',
  AGENTS: 'agents',
  ACTIVITY: 'activity',
};

// Event names
export const EVENTS = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  AGENT_UPDATE: 'agent:update',
  ACTIVITY_NEW: 'activity:new',
};

// Trigger server-side events
export async function triggerTaskEvent(event: string, data: any) {
  if (!pusherServer || !isPusherConfigured) {
    console.log('Pusher not configured, skipping trigger:', event);
    return;
  }
  try {
    await pusherServer.trigger(CHANNELS.TASKS, event, data);
  } catch (error) {
    console.error('Pusher trigger error:', error);
  }
}

export async function triggerAgentEvent(data: any) {
  if (!pusherServer || !isPusherConfigured) return;
  try {
    await pusherServer.trigger(CHANNELS.AGENTS, EVENTS.AGENT_UPDATE, data);
  } catch (error) {
    console.error('Pusher trigger error:', error);
  }
}

export async function triggerActivityEvent(data: any) {
  if (!pusherServer || !isPusherConfigured) return;
  try {
    await pusherServer.trigger(CHANNELS.ACTIVITY, EVENTS.ACTIVITY_NEW, data);
  } catch (error) {
    console.error('Pusher trigger error:', error);
  }
}

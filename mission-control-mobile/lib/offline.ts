// Offline caching and sync queue
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_CACHE_KEY = 'mc_tasks_cache';
const SYNC_QUEUE_KEY = 'mc_sync_queue';

export interface CachedTask {
  id: string;
  title: string;
  description?: string;
  status: 'inbox' | 'planned' | 'in_progress' | 'blocked' | 'done';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QueuedChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  taskId: string;
  data?: Partial<CachedTask>;
  timestamp: number;
}

export const offlineCache = {
  async getTasks(): Promise<CachedTask[] | null> {
    try {
      const cached = await AsyncStorage.getItem(TASKS_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Cache read error:', e);
      return null;
    }
  },

  async setTasks(tasks: CachedTask[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  },

  async getQueue(): Promise<QueuedChange[]> {
    try {
      const queue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      return [];
    }
  },

  async addToQueue(change: QueuedChange): Promise<void> {
    try {
      const queue = await this.getQueue();
      queue.push(change);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Queue add error:', e);
    }
  },

  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (e) {
      console.error('Queue clear error:', e);
    }
  },

  async processQueue(api: any, emitChange?: (change: any) => void): Promise<number> {
    const queue = await this.getQueue();
    let synced = 0;
    
    for (const change of queue) {
      try {
        if (change.type === 'create') {
          await api.createTask(change.data);
        } else if (change.type === 'update') {
          await api.updateTask(change.taskId, change.data);
        } else if (change.type === 'delete') {
          await api.deleteTask(change.taskId);
        }
        
        if (emitChange) {
          emitChange(change);
        }
        synced++;
      } catch (e) {
        console.error('Sync error:', e);
        break;
      }
    }
    
    // Remove synced items from queue
    const remaining = queue.slice(synced);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
    
    return synced;
  }
};

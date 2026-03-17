// Mission Control Mobile API Client
const API_BASE = 'http://localhost:3000/api';

const getToken = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return await AsyncStorage.getItem('auth_token');
};

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'inbox' | 'planned' | 'in_progress' | 'blocked' | 'done';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export const api = {
  async login(token: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('auth_token', token);
    }
    return res.ok;
  },

  async getTasks(): Promise<Task[]> {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.ok ? res.json() : [];
  },

  async createTask(task: Partial<Task>): Promise<Task | null> {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(task),
    });
    return res.ok ? res.json() : null;
  },

  async updateTask(id: string, task: Partial<Task>): Promise<Task | null> {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(task),
    });
    return res.ok ? res.json() : null;
  },

  async deleteTask(id: string): Promise<boolean> {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.ok;
  },
};

export const LANES = [
  { id: 'inbox', title: 'Inbox', color: '#6B7280' },
  { id: 'planned', title: 'Planned', color: '#3B82F6' },
  { id: 'in_progress', title: 'In Progress', color: '#F59E0B' },
  { id: 'blocked', title: 'Blocked', color: '#EF4444' },
  { id: 'done', title: 'Done', color: '#10B981' },
];

export interface Task {
  id: string
  title: string
  description?: string
  status: string // 'inbox' | 'planned' | 'in_progress' | 'blocked' | 'done'
  priority: string // 'low' | 'medium' | 'high'
  tags: string
  agentId?: string
  createdAt: string
  updatedAt: string
}

export interface Agent {
  id: string
  status: string
  lastHeartbeat?: number
  currentTask?: string
  error?: string
}

export interface ActivityLog {
  id: string
  type: string
  payload?: string
  createdAt: string
}

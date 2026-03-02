export interface Task {
  id: string
  title: string
  description?: string
  status: string // 'inbox' | 'planned' | 'in_progress' | 'blocked' | 'done' | 'agent_running'
  priority: string // 'low' | 'medium' | 'high'
  tags: string // JSON array of tags
  labels: string // JSON array of label IDs
  agentId?: string
  dependsOn: string // JSON array of task IDs
  dueDate?: string | null
  timeSpent: number // Time spent in seconds
  timerStarted?: string | null // ISO timestamp
  recurrence?: string | null // null, daily, weekly, monthly
  recurrenceCount: number
  createdAt: string
  updatedAt: string
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
  subtasks?: SubTask[]
}

export interface SubTask {
  id: string
  taskId: string
  title: string
  completed: boolean
  completedAt?: string | null
  order: number
  createdAt: string
}

export interface Label {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  content: string
  author: string
  createdAt: string
}

export interface TaskAttachment {
  id: string
  taskId: string
  filename: string
  contentType: string
  data: string
  size: number
  uploadedBy: string
  createdAt: string
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  command: string
  enabled: boolean
  lastRun?: string | null
  nextRun?: string | null
  status: string
  lastError?: string | null
  createdAt: string
  updatedAt: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string // JSON array
  enabled: boolean
  secret?: string
  createdAt: string
  updatedAt: string
}

export interface Approval {
  id: string
  taskId: string
  type: string
  status: string
  requestedBy?: string
  reviewedBy?: string
  reason?: string
  createdAt: string
  updatedAt: string
}

export interface Metrics {
  totalTasks: number
  completedTasks: number
  tasksByStatus: Record<string, number>
  tasksByPriority: Record<string, number>
  completionRate: number
  avgCompletionTime?: number
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

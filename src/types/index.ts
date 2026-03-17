export interface Task {
  id: string
  title: string
  description?: string
  status: string // 'inbox' | 'planned' | 'in_progress' | 'blocked' | 'done' | 'agent_running'
  priority: string // 'low' | 'medium' | 'high'
  tags: string // JSON array of tags
  labels: string // JSON array of label IDs
  portfolioId?: string | null // Portfolio ID for task grouping
  agentId?: string
  dependsOn: string // JSON array of task IDs
  dueDate?: string | null
  dueTime?: string | null
  reminder?: string | null // ISO timestamp for reminder
  reminderSent?: boolean // whether reminder notification has been sent
  timeSpent: number // Time spent in seconds
  timerStarted?: string | null // ISO timestamp
  estimatedTime?: number | null // Estimated time in seconds
  recurrence?: string | null // null, daily, weekly, monthly
  recurrenceType?: string | null
  recurrenceInterval?: number | null
  recurrenceEndDate?: string | null
  parentTaskId?: string | null
  recurrenceCount: number
  starred?: boolean
  // Location-based reminder fields
  locationName?: string | null
  locationAddress?: string | null
  locationLat?: number | null
  locationLng?: number | null
  locationRadius?: number | null
  locationTrigger?: string | null // 'arrive' | 'leave'
  locationEnabled?: boolean | null
  // External IDs
  todoistId?: string | null
  todoistProjectId?: string | null
  todoistSyncedAt?: string | null
  googleCalendarId?: string | null
  gmailThreadId?: string | null
  asanaId?: string | null
  asanaProjectId?: string | null
  trelloId?: string | null
  trelloBoardId?: string | null
  trelloListId?: string | null
  customFields?: string // JSON array of { key, value, type }
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
  attachmentCount?: number
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
  filepath?: string
  mimeType: string
  fileSize: number
  size?: number
  fileType: 'image' | 'document' | 'other'
  description: string
  contentType?: string
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
  tags: string // JSON array of tags, e.g., '["reminder"]'
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
  runtime?: string
  type?: string
  kind?: string
  key?: string
  messageCount?: number
  createdAt?: number
  uptime?: number
  config?: Record<string, unknown>
  logs?: string[]
}

export interface ActivityLog {
  id: string
  type: string
  payload?: string
  createdAt: string
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Todoist REST API v2 base URL
const TODOIST_API_BASE = 'https://api.todoist.com/rest/v2'

interface TodoistTask {
  id: string
  content: string
  description: string
  project_id: string
  priority: number
  due?: {
    date: string
    datetime?: string
    string: string
    timezone?: string
  }
  labels: string[]
  is_completed: boolean
  created_at: string
}

interface TodoistProject {
  id: string
  name: string
}

const priorityMap: Record<number, string> = {
  1: 'low',
  2: 'medium', 
  3: 'high',
  4: 'high'
}

// Fetch all active tasks from Todoist REST API v2
async function fetchTodoistTasks(apiKey: string): Promise<TodoistTask[]> {
  const response = await fetch(`${TODOIST_API_BASE}/tasks`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    }
  })
  
  if (!response.ok) {
    throw new Error(`Todoist API error: ${response.status} ${response.statusText}`)
  }
  
  // v2 API returns direct array, not wrapped in "results"
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

// Fetch projects to map IDs to names (v2 returns direct array)
async function fetchTodoistProjects(apiKey: string): Promise<TodoistProject[]> {
  const response = await fetch(`${TODOIST_API_BASE}/projects`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    }
  })
  
  if (!response.ok) {
    throw new Error(`Todoist API error: ${response.status}`)
  }
  
  // v2 API returns direct array
  const data = await response.json()
  return Array.isArray(data) ? data.map((p: any) => ({ id: p.id, name: p.name })) : []
}

// Sync tasks from Todoist to Mission Control
export async function syncTodoistTasks(): Promise<{ added: number; updated: number; skipped: number }> {
  const apiKey = process.env.TODOIST_API_KEY
  
  if (!apiKey) {
    throw new Error('TODOIST_API_KEY not configured')
  }

  const [tasks, projects] = await Promise.all([
    fetchTodoistTasks(apiKey),
    fetchTodoistProjects(apiKey)
  ])

  const projectMap = new Map(projects.map(p => [p.id, p.name]))
  
  let added = 0
  let updated = 0
  let skipped = 0

  for (const task of tasks) {
    // Skip completed tasks (V1 API uses "checked" field)
    if (task.is_completed || (task as any).checked) {
      skipped++
      continue
    }
    
    // Skip very old tasks (before 2024)
    if (task.due?.date && task.due.date < '2024-01-01') {
      skipped++
      continue
    }

    const existingTask = await prisma.task.findUnique({
      where: { todoistId: task.id }
    })

    const taskData = {
      title: task.content,
      description: task.description || '',
      status: 'planned' as const,
      priority: priorityMap[task.priority] || 'medium',
      labels: JSON.stringify(task.labels || []),
      dueDate: task.due?.date ? new Date(task.due.date) : null,
      todoistId: task.id,
      todoistProjectId: task.project_id,
      todoistSyncedAt: new Date(),
    }

    if (existingTask) {
      // Update existing task
      await prisma.task.update({
        where: { id: existingTask.id },
        data: {
          ...taskData,
          // Don't overwrite status if user changed it locally
          status: existingTask.status !== 'inbox' ? existingTask.status : taskData.status,
        }
      })
      updated++
    } else {
      // Create new task
      await prisma.task.create({
        data: {
          ...taskData,
          id: `todoist-${task.id}`,
        }
      })
      added++
    }
  }

  return { added, updated, skipped }
}

// Get sync status
export async function getSyncStatus() {
  const lastSyncedTask = await prisma.task.findFirst({
    where: { todoistSyncedAt: { not: null } },
    orderBy: { todoistSyncedAt: 'desc' }
  })

  const totalTodoistTasks = await prisma.task.count({
    where: { todoistId: { not: null } }
  })

  return {
    lastSyncedAt: lastSyncedTask?.todoistSyncedAt || null,
    totalSyncedTasks: totalTodoistTasks,
  }
}

export default { syncTodoistTasks, getSyncStatus, closeTodoistTask }

// Close a task in Todoist (call when marking MC task as done)
// In v2 API, use POST /tasks/{id}/close
export async function closeTodoistTask(todoistId: string): Promise<boolean> {
  const apiKey = process.env.TODOIST_API_KEY
  if (!apiKey) {
    console.error('No TODOIST_API_KEY configured')
    return false
  }

  try {
    const response = await fetch(`${TODOIST_API_BASE}/tasks/${todoistId}/close`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    })
    
    // 204 No Content is success for close operation
    if (response.status === 204 || response.ok) {
      console.log(`✅ Closed Todoist task: ${todoistId}`)
      return true
    } else {
      const errorText = await response.text()
      console.error(`Failed to close Todoist task ${todoistId}:`, response.status, errorText)
      return false
    }
  } catch (error) {
    console.error('Error closing Todoist task:', error)
    return false
  }
}

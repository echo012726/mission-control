# Mission Control API Documentation

## Overview
Mission Control is a client-side task management application with localStorage persistence.

## Data Structures

### Task Object
```typescript
interface Task {
  id: string;              // UUID
  title: string;           // Task title
  description?: string;    // Optional description
  status: 'inbox' | 'planned' | 'inProgress' | 'blocked' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];          // Array of tag strings
  subtasks: Subtask[];     // Nested subtasks
  dueDate?: string;        // ISO date string
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  starred?: boolean;       // Favorited task
  location?: LocationData; // Geolocation data
  recurrence?: RecurrenceData;
  dependsOn?: string[];    // Task IDs this depends on
  assignee?: string;       // Assigned team member
  gmailThreadId?: string;  // Linked Gmail thread
  githubUrl?: string;      // Linked GitHub issue/PR
  customFields?: Record<string, any>;
  timeSpent?: number;      // Minutes tracked
  estimatedTime?: number;  // Estimated minutes
  snoozedUntil?: string;   // Snooze datetime
}
```

### Location Data
```typescript
interface LocationData {
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;      // Meters
  trigger: 'arrive' | 'leave';
  enabled: boolean;
}
```

### Recurrence Data
```typescript
interface RecurrenceData {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  endDate?: string;
}
```

### Subtask
```typescript
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}
```

## Storage Keys
| Key | Description |
|-----|-------------|
| `mc_tasks` | All tasks array |
| `mc_teams` | Team definitions |
| `mc_templates` | Task templates |
| `mc_workflows` | Automation workflows |
| `mc_settings` | App settings |
| `mc_dashboards` | Custom dashboard configs |
| `mc_activity` | Activity log |

## JavaScript API

### Core Functions
```javascript
// Load all tasks
getTasks(): Task[]

// Save tasks to storage  
saveTasks(tasks: Task[]): void

// Create new task
createTask(task: Partial<Task>): Task

// Update existing task
updateTask(id: string, updates: Partial<Task>): Task

// Delete task
deleteTask(id: string): void

// Get tasks by status
getTasksByStatus(status: string): Task[]

// Get tasks by tag
getTasksByTag(tag: string): Task[]

// Search tasks
searchTasks(query: string): Task[]
```

### Quick Add
```javascript
// Parse natural language date
parseDate(input: string): Date | null

// Quick add task
quickAdd(text: string): Task
```

### Team Functions
```javascript
getTeams(): Team[]
createTeam(team: Partial<Team>): Team
addTeamMember(teamId: string, member: Member): void
```

### Template Functions
```javascript
getTemplates(): TaskTemplate[]
createTemplate(template: Partial<TaskTemplate>): TaskTemplate
createFromTemplate(templateId: string): Task
```

### Export Functions
```javascript
exportToJSON(): string
exportToCSV(): string
exportToPDF(): void
```

## Event System
```javascript
// Subscribe to task changes
onTaskChange(callback: (task: Task, action: string) => void): void

// Trigger custom event
emit(event: string, data: any): void
```

## External Integrations

### Gmail
- Link: `POST /api/tasks/{id}/email` (stores gmailThreadId)
- Format: `https://mail.google.com/mail/u/0/#inbox/{threadId}`

### GitHub
- Link: Stores githubUrl on task
- Format: `https://github.com/{owner}/{repo}/issues/{number}`

### Slack
- OAuth flow for workspace connection
- Webhook notifications for task events

### Calendar
- iCal export for tasks with due dates
- Sync via Google Calendar API

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `N` | New task |
| `F` | Focus/search |
| `S` | Star current task |
| `D` | Set due date |
| `P` | Set priority |
| `T` | Add tag |
| `Esc` | Close modal |

## Webhooks
Configure webhook URLs in settings to receive:
- `task.created`
- `task.updated`
- `task.deleted`
- `task.completed`

## Rate Limits
- API: 100 requests/minute
- Webhook retries: 3 attempts with exponential backoff

---

*Generated: March 14, 2026*
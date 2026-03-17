# Mission Control

A comprehensive task management dashboard, agent monitoring system, and productivity hub for OpenClaw.

## ⚠️ Access: Nexus Only

**This app is designed to run within Nexus only.** Do not deploy standalone URLs. All access is through the Nexus app.

## ✨ Features (43+ Implemented)

### Core Task Management
- **Kanban Board** - 5-lane task management (Inbox, Planned, In Progress, Blocked, Done)
- **Drag & Drop** - Move tasks between lanes with @dnd-kit
- **Quick Add** - Fast task creation with natural language date parsing
- **Task Priorities** - Low, Medium, High, Urgent with color coding
- **Tags/Labels** - Organize tasks with custom tags
- **Task Dependencies** - Link tasks with blocker relationships
- **Subtasks** - Break down tasks into smaller items
- **Task Templates** - Save and reuse task patterns
- **Batch Operations** - Multi-select and bulk actions

### Views & Displays
- **Calendar View** - Monthly/weekly view with due dates
- **Gantt Chart** - Timeline visualization for projects
- **Custom Dashboards** - Build personalized widget layouts
- **Advanced Search** - Full-text search with filters and facets
- **Metrics Dashboard** - Real-time statistics and analytics

### Integrations
- **Gmail Integration** - Link email threads to tasks
- **Calendar Integration** - iCal export, Google Calendar sync
- **Slack Integration** - OAuth, notifications, slash commands
- **Notion Integration** - Sync tasks with Notion workspaces
- **GitHub Integration** - Link issues and PRs to tasks
- **Todoist Import** - Import tasks from Todoist
- **Asana/Trello Import** - Import from popular project management tools
- **Zapier/Make Integration** - Connect with 5000+ apps via webhooks

### Productivity Features
- **Voice Commands** - Create tasks via speech recognition
- **Voice Notes** - Record audio notes on tasks
- **Time Tracking** - Built-in timer with start/stop
- **Time Boxing** - Schedule focused work sessions
- **Focus Timer** - Pomodoro-style productivity timer
- **Recurring Tasks** - Daily, weekly, monthly, yearly repetition
- **Sprint Planning** - Agile sprint management
- **Karma Points** - Gamification and productivity scoring

### Automation
- **Custom Workflows** - Visual automation builder with triggers, conditions, actions
- **Webhooks** - Outgoing webhooks for task events
- **Location-based Reminders** - Geofenced task triggers
- **Push Notifications** - Browser notifications for due dates, assignments
- **Two-way Sync** - Real-time data synchronization

### Collaboration
- **Team Collaboration** - Create teams, add members with roles
- **Client Portal** - Share tasks with external clients
- **Task Comments** - Add notes and discussions to tasks
- **Real-time Collaboration** - Live updates via SSE

### Mobile & Desktop
- **PWA/Offline Support** - Works offline with sync on reconnect
- **Mobile App** - React Native/Expo app (mission-control-mobile/)
- **Keyboard Shortcuts** - n (new), / (search), s (star), d (due), p (priority), t (tag), v (voice)

### Data & Security
- **Export** - CSV, JSON, PDF export options
- **Data Encryption** - AES-256-GCM for sensitive data
- **Performance Optimization** - Caching, rate limiting, request deduplication

### AI & Automation
- **AI Chat** - Built-in AI assistant for task management
- **AI-Powered Suggestions** - Smart task recommendations
- **RSS Feed** - Aggregated content feed

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start server (binds to localhost - Nexus access only)
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite/PostgreSQL connection | `file:./dev.db` |
| `MISSION_CONTROL_TOKEN` | Auth token | `mc_dev_token_2024` |
| `NEXTAUTH_SECRET` | NextAuth secret | `mc_dev_secret_change_in_production` |
| `TODOIST_API_KEY` | Todoist sync | - |
| `GITHUB_TOKEN` | GitHub integration | - |
| `SLACK_CLIENT_ID` | Slack OAuth | - |
| `SLACK_CLIENT_SECRET` | Slack OAuth | - |

## Tech Stack

- Next.js 14 (App Router)
- Prisma ORM
- @dnd-kit for drag-and-drop
- Tailwind CSS v4
- Server-Sent Events for real-time
- SQLite (dev) / PostgreSQL (prod)
- Vitest for testing

## API Endpoints

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List all tasks with filters |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/[id]` | Update task |
| DELETE | `/api/tasks/[id]` | Delete task |
| GET | `/api/tasks/search` | Advanced search |
| POST | `/api/tasks/[id]/timer` | Start/stop time tracking |

### Integrations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tasks/[id]/email` | Link Gmail thread |
| POST | `/api/import/asana` | Import from Asana |
| POST | `/api/import/trello` | Import from Trello |
| POST | `/api/workflows/[id]/toggle` | Toggle workflow |

### Data
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/performance` | Performance metrics |
| GET | `/api/time-reports` | Time tracking reports |
| GET | `/api/notifications/settings` | Push notification settings |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `n` | New task |
| `/` | Focus search |
| `s` | Star/unstar task |
| `d` | Set due date |
| `p` | Set priority |
| `t` | Add tag |
| `v` | Toggle voice input |
| `←` `→` | Navigate between lanes |
| `↑` `↓` | Navigate tasks in lane |
| `Enter` | Open selected task |
| `Escape` | Close modals |

## Storage Keys (localStorage)

| Key | Description |
|-----|-------------|
| `mc_tasks` | All tasks array |
| `mc_teams` | Team definitions |
| `mc_templates` | Task templates |
| `mc_workflows` | Automation workflows |
| `mc_settings` | App settings |
| `mc_dashboards` | Custom dashboard configs |
| `mc_activity` | Activity log |

---

*Last Updated: March 14, 2026*

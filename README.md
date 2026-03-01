# Mission Control

A task management dashboard and agent monitoring system for OpenClaw.

## Features

- **Kanban Board** - 5-lane task management (Inbox, Planned, In Progress, Blocked, Done)
- **Drag & Drop** - Move tasks between lanes with @dnd-kit
- **Agent Status Panel** - Real-time monitoring of OpenClaw agents
- **Activity Feed** - Track all actions and events
- **Real-time Updates** - Server-Sent Events (SSE) for live task changes
- **Keyboard Shortcuts** - n (new task), / (search), arrows (navigate), enter (open)
- **Export to CSV** - Download all tasks as CSV file
- **Toast Notifications** - Success/error feedback for all actions
- **Token-based Authentication** - Secure single-user access

## Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The app runs on port 3000 by default. Configure `PORT` or use a reverse proxy.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite/PostgreSQL connection | `file:./dev.db` |
| `MISSION_CONTROL_TOKEN` | Auth token | `mc_dev_token_2024` |
| `NEXTAUTH_SECRET` | NextAuth secret | `mc_dev_secret_change_in_production` |
| `NEXTAUTH_URL` | App URL | `http://localhost:3456` |

## Tech Stack

- Next.js 14 (App Router)
- Prisma ORM
- @dnd-kit for drag-and-drop
- Tailwind CSS
- Server-Sent Events for real-time
- SQLite (dev) / PostgreSQL (prod)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Validate token, set cookie |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/[id]` | Update task |
| DELETE | `/api/tasks/[id]` | Delete task |
| GET | `/api/agents` | Get agent statuses |
| GET | `/api/activity` | Get activity feed |
| GET | `/api/events` | SSE stream for real-time updates |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `n` | New task (in current lane) |
| `/` | Focus search |
| `←` `→` | Navigate between lanes |
| `↑` `↓` | Navigate tasks in lane |
| `Enter` | Open selected task |
| `Escape` | Close modals |

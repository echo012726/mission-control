# Mission Control - Custom Specification

## Overview

Single-user task management and agent monitoring dashboard for Marcus. Self-hosted, lightweight, deployed alongside OpenClaw gateway.

---

## Authentication

- **Mode**: Single user, token-based auth
- **Implementation**: Static bearer token in `Authorization: Bearer <token>` header
- **Token storage**: Environment variable `MISSION_CONTROL_TOKEN` (bcrypt hashed in DB)
- **Login UI**: Simple token input → validates → sets HTTP-only session cookie

---

## Core Features

### 1. Kanban Board

**Lanes**:
- Inbox — New tasks land here
- Planned — Scheduled/queued tasks
- In Progress — Currently active
- Blocked — Waiting on dependency
- Done — Completed

**Task Card Fields**:
- Title (required)
- Description (markdown)
- Priority (low/medium/high)
- Tags (array)
- Created at, Updated at
- Assigned agent (optional)

**Interactions**:
- Drag-and-drop between lanes
- Quick-add task inline
- Click to expand/edit details
- Archive from Done lane

---

### 2. Agent Status Panel

**Display**:
- List all registered agents (from OpenClaw state)
- Status: `idle` | `running` | `error` | `unknown`
- Last heartbeat timestamp
- Current task (if running)
- Error message (if error state)

**Refresh**: Poll every 10 seconds or via manual refresh button

---

### 3. Activity Feed

**Events to display**:
- Task created/moved/completed
- Agent heartbeat received
- Agent error occurred
- User actions (login, task edits)

**Layout**: Chronological stream, newest first. Show timestamp + action description.

---

## Deployment

- **Same server** as OpenClaw gateway
- **Port**: 3456 (or env-configurable)
- **Reverse proxy**: Nginx/Traefik handles `/mission-control` path
- **Database**: Same Postgres instance as OpenClaw (separate tables)

---

## Recommended Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | **Next.js 14** (App Router) | Full-stack, SSR, easy API routes |
| Database | **PostgreSQL** | Already running for OpenClaw |
| ORM | **Prisma** | Type-safe, simple migrations |
| Auth | **NextAuth.js** | Token-based, easy to configure |
| UI | **shadcn/ui** + Tailwind | Clean, composable components |
| State | **TanStack Query** | Client-side caching + mutations |
| Drag-drop | **@dnd-kit** | Accessible, lightweight |

**Alternative**: Supabase (Postgres + Auth + Realtime) for faster dev — but self-hosted Postgres already available, so Next.js + Prisma is simpler.

---

## MVP Scope

**Included**:
- [x] Token auth (static token)
- [x] Kanban board with 5 lanes
- [x] Task CRUD
- [x] Agent status panel (read agent state)
- [x] Basic activity feed

**Deferred** (Post-MVP):
- [ ] Real-time updates (WebSocket)
- [ ] Task dependencies
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Metrics/dashboard charts
- [ ] Webhooks for external integrations

---

## Data Model

```sql
-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'inbox', -- inbox|planned|in_progress|blocked|done
  priority TEXT DEFAULT 'medium',
  tags TEXT[],
  agent_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- task_created|task_moved|agent_heartbeat|agent_error|login
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auth tokens (single user)
CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Validate token, set cookie |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/[id]` | Update task (move, edit) |
| DELETE | `/api/tasks/[id]` | Delete task |
| GET | `/api/agents` | Get agent statuses |
| GET | `/api/activity` | Get activity feed |

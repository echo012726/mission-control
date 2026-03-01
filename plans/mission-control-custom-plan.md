# Mission Control - Implementation Plan

## Phase 1: MVP — Kanban + Agent Panel + Auth

### Week 1: Foundation

- [x] Initialize Next.js 14 project with TypeScript
- [x] Set up Prisma with PostgreSQL connection
- [x] Create database schema (tasks, activity_log, auth_tokens)
- [x] Configure environment variables

### Week 2: Authentication

- [x] Implement token-based auth middleware
- [x] Create login page with token input
- [x] Set up NextAuth.js with bearer token provider (using custom auth instead)
- [x] Add protected route middleware
- [x] Test auth flow end-to-end

### Week 3: Kanban Board

- [x] Build Kanban board layout with 5 lanes
- [x] Implement task list API endpoints (GET, POST, PATCH, DELETE)
- [x] Create task card component
- [x] Add drag-and-drop between lanes using @dnd-kit
- [x] Implement task create/edit modal

### Week 4: Agent Status Panel

- [x] Read agent state from OpenClaw (API or file)
- [x] Build agent list component with status indicators
- [x] Add polling for agent updates (10s interval)
- [x] Display last heartbeat and current task
- [x] Add error state display

**Phase 1 Deliverable**: Functional MVP — login, view/manage tasks on Kanban, see agent statuses ✓ COMPLETE

---

## Phase 2: Activity Feed + Refinements

### Week 5: Activity Feed

- [x] Create activity_log table entries on actions
- [x] Build activity feed UI component
- [x] Implement activity API endpoint
- [x] Wire up events: task CRUD, agent heartbeats, logins

### Week 6: UX Improvements

- [x] Add task detail view with markdown description
- [x] Implement priority and tags
- [x] Add quick-add task input in each lane header
- [x] Polish drag-and-drop animations

**Phase 2 Deliverable**: Complete core functionality with activity tracking ✓ COMPLETE

---

## Phase 3: Advanced Features

### Week 7-8: Real-time & Webhooks

- [x] Add WebSocket for live updates (Pusher or Socket.io) — Polling implemented as alternative
- [x] Implement webhook system for external integrations
- [x] Add webhook configuration UI

### Week 9-10: Metrics & Analytics

- [x] Build simple metrics dashboard
- [x] Track: tasks completed per day, agent uptime, avg task duration
- [ ] Add charts using Recharts

### Week 11-12: Polish

- [x] Mobile responsive layout
- [ ] Keyboard shortcuts
- [x] Task search and filter
- [ ] Export tasks to CSV

**Phase 3 Deliverable**: Full-featured production app

---

## Quick Start Commands

```bash
# Scaffold Next.js
npx create-next-app@latest mission-control --typescript --tailwind --app

# Install dependencies
cd mission-control
npm install @prisma/client next-auth @tanstack/react-query @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react clsx tailwind-merge
npm install -D prisma

# Initialize Prisma
npx prisma init

# Run migrations
npx prisma migrate dev --name init

# Start dev server
npm run dev
```

---

## Environment Variables

```
DATABASE_URL=postgresql://user:pass@localhost:5432/mission_control
MISSION_CONTROL_TOKEN=your-secure-token-here
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3456
OPENCLAW_STATE_PATH=/var/lib/openclaw/agent-state.json
```

---

## Integration Points

- **OpenClaw agent state**: Read from JSON file or API exposed by gateway
- **Database**: Use same Postgres instance, separate schema or tables
- **Reverse proxy**: Route `/mission-control` to port 3456

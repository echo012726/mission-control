# Mission Control — Specification Document

**Version:** 1.0  
**Created:** 2026-02-18  
**Based on:** Alex Finn's Mission Control concept  
**Tech Stack:** NextJS 14 (App Router) + Convex Database + TypeScript + TailwindCSS

---

## 1. Overview

Mission Control is a custom dashboard that transforms OpenClaw from a chatbot into a proactive digital teammate. It provides visual interfaces for tracking tasks, content pipelines, calendars, memories, team structure, and agent status.

**Core Philosophy:**
- OpenClaw can build and maintain this itself
- Components should be independent but share data where appropriate
- Visual-first design — you should be able to see what's happening at a glance

---

## 2. Architecture

### 2.1 Project Structure

```
mission-control/
├── app/
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Dashboard home
│   ├── tasks/              # Tasks Board
│   │   └── page.tsx
│   ├── content/            # Content Pipeline
│   │   └── page.tsx
│   ├── calendar/          # Calendar
│   │   └── page.tsx
│   ├── memory/            # Memory Browser
│   │   └── page.tsx
│   ├── team/              # Team Structure
│   │   └── page.tsx
│   └── office/            # Digital Office
│       └── page.tsx
├── components/
│   ├── ui/                # Shared UI components (shadcn/ui style)
│   ├── Navbar.tsx
│   ├── StatusBadge.tsx
│   └── ...
├── lib/
│   └── convex/            # Convex backend
│       ├── schema.ts     # Database schema
│       ├── tasks.ts      # Task mutations/queries
│       ├── content.ts    # Content mutations/queries
│       ├── calendar.ts   # Calendar mutations/queries
│       ├── memory.ts     # Memory mutations/queries
│       └── agents.ts     # Agent mutations/queries
├── convex.json
├── next.config.js
└── package.json
```

### 2.2 Database Schema (Convex)

```typescript
// schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // TASKS BOARD
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("blocked")
    ),
    assignee: v.union(v.literal("user"), v.literal("agent")),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"])
   .index("by_assignee", ["assignee"]),

  // CONTENT PIPELINE
  content: defineTable({
    title: v.string(),
    stage: v.union(
      v.literal("idea"),
      v.literal("scripting"),
      v.literal("thumbnail"),
      v.literal("filming"),
      v.literal("editing"),
      v.literal("published"),
      v.literal("archived")
    ),
    script: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_stage", ["stage"]),

  // CALENDAR
  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("cron_job"),
      v.literal("scheduled_task"),
      v.literal("reminder"),
      v.literal("meeting")
    ),
    scheduledAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.union(v.literal("scheduled"), v.literal("completed"), v.literal("cancelled")),
    recurring: v.optional(v.boolean()),
    cronExpression: v.optional(v.string()),
  }).index("by_scheduled", ["scheduledAt"]),

  // MEMORY
  memories: defineTable({
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    source: v.optional(v.string()), // e.g., "conversation", "task", "manual"
    createdAt: v.number(),
  }).index("by_tags", ["tags"]),

  // AGENTS / TEAM
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("idle"), v.literal("working"), v.literal("waiting")),
    currentTask: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_status", ["status"]),
});
```

---

## 3. Component Specifications

### 3.1 Tasks Board

**Purpose:** Track all tasks being worked on, by whom (user or agent).

**Features:**
- Kanban-style columns: To Do | In Progress | Done | Blocked
- Filter by assignee (me / agent)
- Create new tasks
- Edit task details
- Drag-and-drop between columns (optional MVP: click to change status)
- Real-time updates

**UI Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ TASKS BOARD                    [+ New Task] [Filter ▼] │
├──────────┬──────────────┬──────────┬──────────┬────────┤
│ TODO     │ IN PROGRESS  │ DONE     │ BLOCKED   │        │
│          │              │          │           │        │
│ [Task 1] │ [Task 3]     │ [Task 2] │ [Task 5]  │        │
│ [Task 4] │              │          │           │        │
└──────────┴──────────────┴──────────┴──────────┴────────┘
```

**Prompt for OpenClaw (to build it):**
> Please build a task board for us that tracks all the tasks we are working on. I should be able to see the status of every task and who the task is assigned to, me or you. Moving forward please put all tasks you work on into this board and update it in real time.

---

### 3.2 Content Pipeline

**Purpose:** Manage content creation from idea to publication.

**Stages:**
1. **Idea** — Raw concept, brief notes
2. **Scripting** — Writing the script
3. **Thumbnail** — Generate/create thumbnail
4. **Filming** — Ready to film / in production
5. **Editing** — Post-production
6. **Published** — Live
7. **Archived** — Old content

**Features:**
- Visual pipeline (column-based like Tasks)
- Click to view full details (script, images)
- Edit script inline
- Attach images
- OpenClaw manages pipeline proactively

**UI Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ CONTENT PIPELINE                   [+ New Idea]               │
├────────┬──────────┬──────────┬─────────┬────────┬────────────┤
│ IDEA   │ SCRIPTING│THUMBNAIL │ FILMING │EDITING │ PUBLISHED  │
│        │          │          │         │        │            │
│ [Idea1]│ [Item 2] │ [Item 3] │         │        │ [Item 5]   │
└────────┴──────────┴──────────┴─────────┴────────┴────────────┘
```

**Prompt for OpenClaw:**
> Please build me a content pipeline tool. I want it to have every stage of content creation in it. I should be able to edit ideas and put full scripts in it and attach images if need be. I want you to manage this pipeline with me and add wherever you can.

---

### 3.3 Calendar

**Purpose:** Visual view of all scheduled tasks and cron jobs.

**Features:**
- Monthly/weekly view
- List of upcoming events
- Shows: cron jobs, scheduled tasks, reminders
- Color-coded by type
- Click to view details

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ CALENDAR        ◀ February 2026 ▶          [+ Event]      │
├─────────────────────────────────────────────────────────────┤
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun                          │
│                     1     2    3    4                        │
│   5    6    7    8    9   10   11                           │
│  12   13   14*  15   16   17   18  (* = has events)        │
│  ...                                                        │
├─────────────────────────────────────────────────────────────┤
│ UPCOMING                                                      │
│ • Feb 14 2:00pm - Daily digest (cron)                       │
│ • Feb 15 9:00am - Heartbeat check (cron)                    │
└─────────────────────────────────────────────────────────────┘
```

**Prompt for OpenClaw:**
> Please build a calendar for us in the mission control. All your scheduled tasks and cron jobs should live here. Anytime I have you schedule a task, put it in the calendar so I can ensure you are doing them correctly.

---

### 3.4 Memory Browser

**Purpose:** Visual interface for searching/viewing all memories.

**Features:**
- List all memories as cards
- Full-text search
- Filter by tags
- Click to view full memory content
- Shows source (conversation, task, manual)

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ MEMORY BROWSER                           [Search...]  [▼Tag]│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Marcus's Preferences                                    │ │
│ │ Prefers autonomy over time...                          │ │
│ │ Tags: preferences, workflow                            │ │
│ │ Source: conversation | Jan 15, 2026                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PolyMarket Bot Setup                                    │ │
│ │ Running on VPS in paper mode...                        │ │
│ │ Tags: project, polymarket                              │ │
│ │ Source: task | Feb 18, 2026                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Prompt for OpenClaw:**
> Please build a memory screen in our mission control. It should list all your memories in beautiful documents. We should also have a search component so I can quickly search through all our memories.

---

### 3.5 Team Structure

**Purpose:** Visual org chart of all agents/sub-agents.

**Features:**
- Card-based view of each agent
- Shows: name, role, description, status
- Click to view agent details
- Auto-updates as agents are created/removed

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ TEAM STRUCTURE                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐                                         │
│   │    MARCUS    │ ← You (Human)                          │
│   │   (Boss)     │                                         │
│   └──────────────┘                                         │
│         │                                                   │
│   ┌─────┴─────┐                                            │
│   ▼           ▼                                             │
│ ┌──────┐  ┌──────┐                                         │
│ │ ECHO │  │ POLY │  ← Sub-agents                          │
│ │(main)│  │ BOT  │                                         │
│ └──────┘  └──────┘                                         │
│                                                             │
│ Other agents: researcher, coder, debugger, etc.              │
└─────────────────────────────────────────────────────────────┘
```

**Prompt for OpenClaw:**
> Please build me a team structure screen. It should show you, plus all the subagents you regularly spin up to do work. If you haven't thought about which sub agents you spin up, please create them and organize them by roles and responsibilities. This should be developers, writers, and designers as examples.

---

### 3.6 Digital Office

**Purpose:** Fun + functional view of what agents are working on.

**Features:**
- Visual room/office layout
- Each agent represented by avatar
- Status indicators (working at desk, idle, waiting)
- Current task displayed
- Click agent for details

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ DIGITAL OFFICE                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────┐          │
│   │  ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐  │          │
│   │  │ 💻  │    │ 💻  │    │ 💻  │    │ 💻  │  │          │
│   │  │     │    │     │    │     │    │     │  │          │
│   │  │Echo │    │Poly │    │Research│  │Debug│  │          │
│   │  │(🟢) │    │(🟡) │    │ (🟢)  │  │(🔴) │  │          │
│   │  └─────┘    └─────┘    └─────┘    └─────┘  │          │
│   │  Working   Idle      Working    Blocked    │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│ Legend: 🟢 Working | 🟡 Idle | 🔴 Blocked                   │
└─────────────────────────────────────────────────────────────┘
```

**Prompt for OpenClaw:**
> Please build me a digital office screen where I can view each agent working. They should be represented by individual avatars and have their own work areas and computers. When they are working they should be at their computer. I should be able to quickly view the status of every team member.

---

## 4. Integration Points

### 4.1 OpenClaw → Mission Control

OpenClaw should automatically:
1. **Tasks:** Create/update tasks when working on them
2. **Content:** Move content through pipeline stages
3. **Calendar:** Log all scheduled cron jobs
4. **Memory:** Save important memories automatically
5. **Team:** Register new sub-agents when spawned

### 4.2 User → Mission Control

User can:
1. Create/edit/delete tasks
2. Add content ideas
3. View all scheduled work
4. Search past memories
5. See what agent is doing what

---

## 5. Deployment

**Option A: Convex Hosting (Recommended)**
- Deploy to Convex Cloud (free tier available)
- Automatic CI/CD

**Option B: Vercel + Convex**
- Frontend on Vercel
- Backend on Convex

**Prompt for deployment:**
> Please deploy this Mission Control app to Vercel with Convex backend and provide me the URL.

---

## 6. Future Enhancements (Post-MVP)

- [ ] Drag-and-drop task board
- [ ] Real-time collaboration
- [ ] Push notifications
- [ ] Mobile responsive design
- [ ] Dark/light mode
- [ ] Agent avatars (AI-generated)
- [ ] Activity feed/log

---

## 7. Build Order

**Phase 1: Foundation**
1. Set up NextJS + Convex project
2. Define schema
3. Build shared components

**Phase 2: Core Components**
4. Tasks Board
5. Content Pipeline
6. Calendar

**Phase 3: Advanced**
7. Memory Browser
8. Team Structure
9. Digital Office

---

## 8. Success Criteria

- [ ] All 6 components render without errors
- [ ] Data persists in Convex
- [ ] OpenClaw can read/write to all tables
- [ ] User can view via web browser
- [ ] Real-time updates work

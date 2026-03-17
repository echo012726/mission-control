# Mission Control - New Enhancement Features

## Status: All Original 10 Backlog Features Complete ✅

---

## New Enhancement: Quick Add Per Lane

### Feature: Inline Quick Add Input in Each Lane
- **Priority:** HIGH
- **Status:** Implemented ✅
- **Description:** Fast task creation directly from lane headers without opening modal

**Implementation:**
- Added quick add input at top of each lane (Inbox, Planned, In Progress, Blocked, Done)
- Type title + Enter to create task instantly in that lane
- Input remains focused for rapid multi-task entry
- Loading state shown during API call

**Usage:**
- Click quick-add input in any lane header
- Type task title
- Press Enter - task created instantly
- Input clears and stays focused for next task

**Keyboard Enhancement:**
- Works seamlessly with lane selection (1-6 keys)
- Combined with 'n' for full modal create

---

## New Enhancement: Natural Language Date Parsing

### Feature: Natural Language Due Dates
- **Priority:** HIGH
- **Status:** Implemented ✅
- **Description:** Type due dates in natural language like "next friday", "tomorrow", "in 3 days"

**Implementation:**
- Created `/src/lib/naturalDate.ts` - Natural language date parser
- Supports patterns:
  - Relative: "today", "tonight", "tomorrow", "tomorrow morning", "next week", "next month"
  - Days: "monday", "friday", "next monday"
  - Duration: "in 3 days", "in 2 weeks", "in 1 month"
  - Time: "morning", "afternoon", "evening", "night"
- Quick suggestion buttons in Add Task modal
- Auto-updates both dueDate and dueTime fields

**Usage:**
- Type in Due field: "next friday", "tomorrow", "in 3 days"
- Click suggestion buttons for common dates
- Falls back to standard date picker

---

## New Enhancement Features (Post-Backlog)

### 1. Quick Task Capture API
- **Priority:** HIGH
- **Status:** Implemented ✅
- **Description:** Simple API endpoint to create tasks from external automation tools (IFTTT, Zapier, curl, etc.)
- **Use Case:** Marcus can trigger task creation from other apps

**Implementation:**
- Created `/api/tasks/quick-add` endpoint ✅
- Auth via `X-API-Key` header (`mc_quick_add_2026` default) ✅
- Supports: title, description, status, priority, tags, labels, dueDate, recurrence, customFields, estimatedTime ✅
- Broadcasts to SSE clients for real-time updates ✅
- Triggers webhooks and Pusher events ✅

**Usage:**
```bash
curl -X POST http://localhost:3456/api/tasks/quick-add \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mc_quick_add_2026" \
  -d '{"title": "Quick task from API", "priority": "high"}'
```

### 2. Browser Push Notifications
- **Priority:** HIGH
- **Status:** Implemented ✅
- **Description:** Desktop notifications when tasks are due or assigned via Web Push API

**Implementation:**
- Added `NotificationSettings` model to Prisma schema
- Created `/api/notifications` endpoint for subscription management
- Created `/api/notifications/test` endpoint for testing
- Created `usePushNotifications` hook for client-side subscription handling
- Created `NotificationBell` component in header for toggling push notifications
- Updated service worker (`/public/sw.js`) to handle push events
- Supports: due date reminders, assigned tasks, mentions, daily digest
- Uses VAPID authentication for secure push

**Configuration (optional for production):**
```env
VAPID_PUBLIC_KEY=your-generated-key
VAPID_PRIVATE_KEY=your-generated-key
```

### 3. Task Reminders
- **Priority:** MEDIUM
- **Status:** Implemented ✅
- **Description:** Set reminder times on individual tasks with snooze functionality

**Implementation:**
- Added `reminder` and `reminderSent` fields to Task model
- Created `/api/tasks/reminders` endpoint for CRUD operations
- Created `/api/cron/reminders` endpoint for scheduled reminder processing
- Updated KanbanBoard.tsx with reminder picker in edit task modal
- Quick reminder buttons: 1 day before, 1 hour before, in 15 min
- Supports snooze functionality via API

### 4. Dark Mode Toggle
- **Priority:** MEDIUM
- **Status:** Implemented ✅
- **Description:** Manual theme switching (dark/light)

**Implementation:**
- Added dark mode toggle button in header (Sun/Moon icon)
- Uses localStorage to persist theme preference
- Toggle updates `dark` class on `<html>` element
- Works with Tailwind's dark mode

**UI Location:** Header toolbar (right side)

---

### 5. Daily Goals Widget
- **Priority:** MEDIUM
- **Status:** Implemented ✅
- **Description:** Set daily task completion goals and track progress

**Implementation:**
- Created `DailyGoalsWidget` component
- Circular progress indicator showing completed/target tasks
- Settings to customize daily goal (1-100 tasks)
- Persists goal in localStorage
- Fetches today's completed tasks from API
- Shows celebration when goal is reached

**Widget Location:** Available in Dashboard → Add Widget → Daily Goals

---

## Implementation: Quick Task Capture API

**Feature:** Simple endpoint to create tasks without full session auth
**Endpoint:** `POST /api/tasks/quick-add`
**Auth:** API key in header (`X-API-Key`)

### Request
```json
{
  "title": "Task title",
  "description": "Optional description",
  "priority": "high|medium|low",
  "dueDate": "2026-03-15T14:00:00Z"
}
```

### Response
```json
{
  "id": "uuid",
  "title": "Task title",
  "status": "inbox",
  "createdAt": "2026-03-08T02:10:00Z"
}
```

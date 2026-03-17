# Feature Specification: Task Snooze

**Feature:** Task Snooze  
**Status:** ✅ IMPLEMENTED  
**Selected:** March 13, 2026  
**Priority:** Medium  

## Problem

Users need to temporarily hide tasks that aren't actionable right now but shouldn't be deleted or lost. Currently, there's no way to "park" a task without it cluttering the board.

## Solution

Add snooze functionality that hides tasks until a specified date/time, then automatically reveals them.

## Features

### Core Functionality
- **Snooze Button** - Click to snooze a task (clock icon in task card)
- **Snooze Duration Options**:
  - Later today (set to 6 PM today)
  - Tomorrow morning (9 AM)
  - Next week (same time, 7 days later)
  - Custom date/time picker
- **Snoozed Tasks View** - Filter to see all snoozed tasks
- **Auto-reveal** - Tasks reappear on kanban when snooze time passes
- **Visual Indicator** - Snoozed tasks show clock icon and muted appearance
- **Unsnooze** - Click to bring back immediately

### UI Elements
- Snooze icon button on task cards (🕐 or clock emoji)
- Snooze modal with duration options + custom datetime picker
- "Snoozed" filter in QuickFilters
- Badge count showing number of snoozed tasks
- Toast notification when task snoozed/unsnoozed

### Data Model
```typescript
interface Task {
  // ... existing fields
  snoozedUntil?: Date | null;  // null = not snoozed
  originalSnoozeDate?: Date;   // for recurring snooze
}
```

### API Endpoints
- `POST /api/tasks/:id/snooze` - Set snooze time
- `POST /api/tasks/:id/unsnooze` - Remove snooze
- Filter param `snoozed=true` for getting snoozed tasks

## Acceptance Criteria

- [x] Snooze button visible on each task card
- [x] Clicking snooze opens modal with duration options
- [x] Can select preset durations (today, tomorrow, next week)
- [x] Can pick custom date/time
- [x] Task disappears from board when snoozed
- [x] Task reappears when snooze time passes
- [x] "Snoozed" filter shows all snoozed tasks
- [x] Unsnooze button returns task to board immediately
- [x] Snooze state persists to localStorage
- [x] Visual indicator (muted/clock icon) on snoozed tasks

## Files to Modify

- `/kanban.html` - Add snooze UI and logic (~200 lines)
- `/src/app/api/tasks/route.ts` - Add snooze endpoints (optional)

## Implementation Notes

- Use `setTimeout` to trigger auto-reveal when page is open
- Check snoozed tasks on page load and filter accordingly
- Store snooze data in localStorage with task ID keys

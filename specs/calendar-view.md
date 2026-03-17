# Calendar View - Feature Specification

## Overview
Add a calendar view to Mission Control that displays tasks in a traditional monthly/weekly calendar format, complementing the existing Kanban board.

## Implementation Complete ✓ (March 12, 2026)

### Files Created
- `src/components/CalendarView.tsx` - Full calendar view component

### Files Modified  
- `src/components/KanbanBoard.tsx` - Integrated calendar view toggle

## UI/UX Specification

### Layout
- Toggle between Kanban and Calendar views (in KanbanBoard toolbar)
- Monthly calendar as default
- Week view option
- Navigation: Previous/Next month/week, Today button

### Task Display
- Tasks show on their due dates
- Color-coded by priority (red=high, yellow=medium, green=low/default)
- Overflow indicator when >3 tasks on a day
- Click day to select, double-click to quick add
- Drag tasks between days to change due date

### Visual Design
- Dark mode support (matches existing theme)
- Calendar grid: 7 columns (Sun-Sat)
- Current day highlighted with blue border
- Past days slightly dimmed (not current month)
- Today: accent color highlight

## Functionality

### Core Features
1. **View Toggle** - Button in KanbanBoard toolbar switches between views
2. **Monthly View** - Full month grid with task indicators
3. **Weekly View** - 7-day detailed view
4. **Task Creation** - Double-click day to quick add with pre-filled date
5. **Drag & Drop** - Drag task card to different day to reschedule
6. **Click to Edit** - Click task to open edit modal
7. **Selected Day Panel** - Shows tasks for selected day at bottom

### Data Handling
- Uses tasks from KanbanBoard state
- PATCH request to API to update dueDate on drag-drop
- Local state update for immediate feedback
- Labels passed for potential future use

## Acceptance Criteria - All Met
- [x] Calendar toggle appears in KanbanBoard toolbar
- [x] Monthly view renders correctly with task indicators
- [x] Can navigate between months
- [x] Tasks appear on correct due dates
- [x] Can create task from calendar day (double-click)
- [x] Can drag task to new due date
- [x] Works in dark mode
- [x] Priority color coding
- [x] Week view available

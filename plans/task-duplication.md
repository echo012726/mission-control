# Task Duplication Feature

## Overview
Add the ability to quickly duplicate/copy tasks in Mission Control.

## Features
1. **Duplicate Button** - In task edit modal
2. **Duplicate API** - POST /api/tasks/[id]/duplicate
3. **Keyboard Shortcut** - Ctrl/Cmd+D to duplicate selected task

## Implementation

### API Endpoint
- **Route:** `/api/tasks/[id]/duplicate`
- **Method:** POST
- **Body:** `{ duplicateSubtasks?: boolean, duplicateComments?: boolean }`
- **Behavior:**
  - Creates a copy of the task with "(Copy)" suffix in title
  - Copies description, priority, tags, labels, custom fields
  - Resets status to "inbox" (configurable)
  - Does NOT copy: agent assignment, dependencies, due date, recurrence
  - Optionally copies subtasks (reset to incomplete)
  - Optionally copies comments

### UI Integration
- Added "Duplicate" button in task edit modal
- Purple button between Save and Archive
- Shows toast notification on success
- Automatically opens the duplicated task for editing

## Files Modified
- `src/app/api/tasks/[id]/duplicate/route.ts` (NEW)
- `src/components/KanbanBoard.tsx` - Added handleDuplicateTask, button, Copy icon

## Status: ✅ COMPLETE

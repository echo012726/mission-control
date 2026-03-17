# Bulk Operations Enhancement

## Overview
Add multi-select capability to Kanban board for batch task operations (move, delete, change priority, change tags).

## Features
1. **Multi-select Mode Toggle** - Button to enter/exit multi-select mode
2. **Task Checkboxes** - Visual checkboxes on task cards in multi-select mode
3. **Selection Counter** - Shows number of selected tasks
4. **Bulk Action Bar** - Appears at bottom with actions:
   - Move to status (dropdown)
   - Set priority (dropdown) 
   - Add/remove tags
   - Delete selected
   - Clear selection
5. **API Endpoints** - POST /api/tasks/bulk for batch operations
6. **Keyboard Shortcuts** - Shift+Click to multi-select, Ctrl+A to select all in lane

## Status: ✅ COMPLETE

## Implemented
- [x] Multi-select mode toggle button
- [x] Selected tasks state management
- [x] Checkbox UI on TaskCard
- [x] Bulk action bar with move/priority/delete
- [x] Bulk API route at /api/tasks/bulk
- [x] Full CRUD operations (move, priority, delete, tags, dueDate, labels, recurrence)

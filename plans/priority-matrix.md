# Priority Matrix Implementation Plan

## Feature: Eisenhower Matrix View

### Overview
Add a toggle to switch between Kanban view and 2x2 Priority Matrix view (Urgent/Important quadrants).

### Quadrants
- **Q1: Urgent & Important** (Do First) - Red
- **Q2: Not Urgent & Important** (Schedule) - Blue  
- **Q3: Urgent & Not Important** (Delegate) - Yellow
- **Q4: Not Urgent & Not Important** (Eliminate) - Gray

### Implementation Steps

#### Phase 1: Backend
- [ ] Add `priority` field values if not already (low, medium, high, urgent)
- [ ] Add `dueDate` field to Task model
- [ ] API endpoint to get tasks grouped by priority/dueDate

#### Phase 2: Frontend
- [ ] Create PriorityMatrix component
- [ ] Add view toggle button (Kanban/Matrix)
- [ ] Implement 4-quadrant layout
- [ ] Drag-and-drop between quadrants
- [ ] Task cards in each quadrant

#### Phase 3: Polish
- [ ] Color coding per quadrant
- [ ] Task count badges
- [ ] Responsive design

### Files to Modify
- `src/components/KanbanBoard.tsx` - Add view toggle
- `src/components/PriorityMatrix.tsx` - New component
- `prisma/schema.prisma` - Ensure dueDate field exists
- `src/app/api/tasks/route.ts` - Ensure priority enum

### Priority
**HIGH** - Core productivity feature for task prioritization

## Status: BUG FIX COMPLETE ✅

Fixed issues:
1. **API URL bug** (line 87): Changed malformed `/api/...?token=marcus2026&tasks?token=mc_dev_token_2024` to `/api/tasks?token=mc_dev_token_2024`
2. **KanbanBoard.tsx** (line 3214): Fixed reference to undefined `setShowTaskModal` → now uses `setEditingTask(task)` properly

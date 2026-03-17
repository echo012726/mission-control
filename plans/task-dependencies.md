# Enhancement: Task Dependencies

## Problem
Users need to track when one task blocks another (e.g., "Setup server" must complete before "Deploy app").

## Solution
Add dependency tracking to tasks with visual indicators showing blocked/unblocked status.

## Implementation Plan

### Backend Changes
1. **Database Schema**: Add `dependsOn` field to task model (already exists as `dependsOn: string[]`)
2. **API Endpoints**:
   - `PATCH /api/tasks/:id` - update dependsOn
   - Include dependency info in task responses

### Frontend Changes
1. **Task Card UI**:
   - Show dependency badge/icon when task has dependencies
   - Visual indicator for "blocked by" tasks
   - Color coding: gray (blocked), green (can proceed)

2. **Task Detail Modal**:
   - Add "Depends on" section to select other tasks
   - Show blocking status

3. **Kanban Board**:
   - Dim or add icon to blocked tasks that can't be moved to done
   - Visual chain/link icon for dependencies

### Edge Cases
- Circular dependency detection
- Deleting a task that's a dependency
- Moving blocked tasks to done (prevent or warn)

## Status
- [x] Designed
- [ ] Backend implementation
- [ ] Frontend implementation  
- [ ] Testing

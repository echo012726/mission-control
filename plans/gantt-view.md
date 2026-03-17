# Gantt/Timeline View - Enhancement Plan

## Feature: Gantt Chart Timeline View

**Priority**: MEDIUM (P1)
**Effort**: High
**Status**: ✅ COMPLETE (March 7th, 2026)

## Description
Add a timeline/Gantt chart view to visualize tasks and their dependencies over time.

## UI Components
- Toggle button to switch between Kanban and Gantt views
- Horizontal timeline with day/week/month zoom
- Task bars showing duration (due date - created date)
- Dependency arrows between related tasks
- Today marker line

## Technical Approach
- Use a library like `gantt-task-react` or build with CSS Grid
- Calculate task positions based on dates
- Draw SVG arrows for dependencies

## Implementation Steps
- [x] Create GanttChart component
- [x] Add view toggle (Kanban/Gantt) to header
- [x] Implement timeline rendering with date range
- [x] Draw task bars with drag-to-resize
- [x] Show dependency arrows
- [x] Add zoom controls (day/week/month)

## Acceptance Criteria
- [x] Can toggle to Gantt view
- [x] Tasks display as bars on timeline
- [x] Dependencies shown as arrows
- [x] Can zoom in/out of timeline
- [x] Today marker visible

## Integration (March 7th, 2026)
The GanttView component was created in a prior session but was NOT integrated into KanbanBoard. Integration completed:

- Added GanttView import to KanbanBoard.tsx
- Updated viewMode state to support 'gantt' option
- Added Gantt toggle button (indigo color, next to Matrix toggle)
- GanttView renders when viewMode === 'gantt'
- Clicking tasks in Gantt view opens edit modal

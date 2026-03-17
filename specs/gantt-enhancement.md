# Gantt Chart Enhancement - Dependency Visualization

## Current State
- Gantt chart UI is implemented in kanban.html
- Tasks display on timeline with proper date positioning
- Today marker works
- Zoom controls (day/week/month) work

## Missing Feature
- **Dependency visualization** - No visual lines connecting dependent tasks

## Enhancement Plan

### 1. Add dependency data to tasks
- Tasks need a `dependsOn` field (array of task IDs)
- This may already be supported but not visualized

### 2. Draw dependency lines
- Use SVG overlay for dependency connections
- Draw curved lines from end of blocker task to start of blocked task
- Color code by status (green=completed, yellow=in-progress, gray=planned)

### 3. Update render function
- Parse task dependencies
- Calculate line coordinates based on task bar positions
- Add SVG to Gantt chart container

## Implementation Steps
1. Add CSS for dependency lines (curved, colored by status)
2. Update renderGanttChart() to calculate and draw dependency SVG
3. Handle edge cases (circular dependencies, tasks without dates)

## Acceptance Criteria
- [x] Gantt toggle works
- [x] Tasks display on timeline correctly  
- [ ] Dependencies show as connecting lines (ADD THIS)
- [x] Today marker visible
- [x] Responsive to data changes
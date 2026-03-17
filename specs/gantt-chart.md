# Gantt Chart View - Specification

## Overview
Add a Gantt/timeline view to Mission Control that visualizes tasks on a horizontal timeline based on their start/due dates, with support for dependencies.

## Features
1. **Toggle View** - Switch between Kanban and Gantt views via header button
2. **Timeline Grid** - Horizontal scrollable timeline showing days/weeks
3. **Task Bars** - Tasks displayed as bars from start date to due date
4. **Dependency Lines** - Visual connectors between dependent tasks
5. **Drag to Resize** - Drag bar edges to adjust dates
6. **Today Marker** - Vertical line showing current date
7. **Zoom Controls** - Zoom in/out (day/week/month view)

## UI/UX
- Gantt button in header (📊 icon)
- Sidebar panel for Gantt settings
- Color-coded by priority
- Hover shows task details tooltip
- Click to open task edit modal

## Technical Implementation
- HTML/CSS/JS in kanban.html
- Use existing task data from localStorage
- Parse startDate and dueDate for positioning
- SVG or CSS-based dependency lines
- Smooth animations for transitions

## Success Criteria
- [ ] View toggle works
- [ ] Tasks display on timeline correctly
- [ ] Dependencies show as connecting lines
- [ ] Today marker visible
- [ ] Responsive to data changes

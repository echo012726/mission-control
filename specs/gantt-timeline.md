# SPEC.md - Gantt Chart / Timeline View

## Feature: Gantt Chart / Timeline View for Mission Control

### Overview
Add a visual Gantt chart / timeline view to Mission Control that displays tasks with due dates on a horizontal timeline, showing task duration, dependencies, and project progress.

### Core Features

1. **Timeline View Toggle**
   - New "Timeline" view option alongside existing List/Kanban/Calendar views
   - Toggle in the view switcher (top-right of task area)
   - Smooth transition animation between views

2. **Gantt Chart Rendering**
   - Horizontal scrollable timeline
   - Date range: Shows 2 weeks by default, expandable
   - Task bars positioned by start/due date
   - Color-coded by priority (High=Red, Medium=Yellow, Low=Green)
   - Task bar shows: title, duration, completion percentage

3. **Task Dependencies**
   - Visual arrows connecting dependent tasks
   - Dependency types: "blocks", "blocked by", "follows"
   - Highlight dependency chain on hover

4. **Interactivity**
   - Click task bar to open task detail modal
   - Drag to adjust dates (updates task due date)
   - Resize bar to change duration
   - Zoom controls: Day/Week/Month view

5. **Filters & Search**
   - Filter by: Project, Priority, Assignee, Tag
   - Search within timeline
   - Show/hide completed tasks toggle

6. **Project Grouping**
   - Group tasks by project
   - Collapse/expand project rows
   - Project progress bar (aggregate of tasks)

### UI/UX

- Dark theme compatible (matches Mission Control dark mode)
- Smooth animations for interactions
- Responsive: Horizontal scroll on mobile, full view on desktop
- Today marker (vertical red line)
- Weekend shading

### Technical Implementation

- Frontend: React component with SVG/Canvas rendering
- Store timeline state in localStorage
- Use existing task data structure (no schema changes needed)
- API: Optional endpoint for timeline-specific aggregations

### Acceptance Criteria

1. ✅ Timeline view toggle appears in view switcher
2. ✅ Tasks with due dates render as horizontal bars
3. ✅ Tasks without due dates hidden in timeline view
4. ✅ Priority color coding visible on bars
5. ✅ Dependencies show connecting arrows
6. ✅ Click on task opens detail modal
7. ✅ Date range adjustable (zoom in/out)
8. ✅ Filter controls work correctly
9. ✅ Dark mode renders correctly
10. ✅ Mobile responsive (horizontal scroll)

---

_Last updated: March 12, 2026_

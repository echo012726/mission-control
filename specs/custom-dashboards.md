# Custom Dashboards - Specification

## Overview
Allow users to create personalized dashboard layouts with draggable widgets, multiple dashboard tabs, and custom widget configurations.

## Features
1. **Multiple Dashboard Tabs** - Create, rename, delete custom dashboards
2. **Drag-and-Drop Widgets** - Add widgets and arrange them freely
3. **Widget Types**:
   - Task Stats (total, completed, pending, rate)
   - Activity Feed
   - Calendar Widget
   - Karma Points
   - Focus Timer
   - Quick Add
   - Priority Breakdown
   - Tags Overview
   - Upcoming Deadlines
4. **Widget Settings** - Configure widget title, size, refresh interval
5. **Dashboard Templates** - Pre-built layouts (Focus, Overview, Review)
6. **Save/Load** - Persist to localStorage

## UI/UX
- "+" button to add new dashboard tab
- Drag handle on widgets for repositioning
- Settings gear icon on each widget
- Trash zone to remove widgets
- Grid-based layout (12-column)

## Technical Implementation
- HTML/CSS/JS in kanban.html
- localStorage for persistence
- CSS Grid for widget layout
- Drag and drop API

## Success Criteria
- [ ] Can create new dashboard tabs
- [ ] Can add widgets to dashboard
- [ ] Widgets can be repositioned
- [ ] Dashboard persists after refresh
- [ ] Can delete dashboards

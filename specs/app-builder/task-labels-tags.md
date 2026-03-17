# Feature Spec: Task Labels/Tags

## Feature Name
Task Labels/Tags

## Description
Add the ability to create, assign, and filter tasks by custom labels/tags. This enables users to organize tasks by context, project, or priority using color-coded tags.

## Acceptance Criteria

1. **Tag Management**
   - Create new tags with custom name and color
   - Edit existing tag names and colors
   - Delete tags (with confirmation)
   - Tags persist in database

2. **Task Assignment**
   - Add multiple tags to any task
   - Remove tags from tasks
   - Display tags on task cards in Kanban/Gantt views
   - Tags show as colored chips/badges

3. **Filtering**
   - Filter tasks by tag(s) in Kanban view
   - Multi-select filter for multiple tags
   - Clear filters button
   - Visual indicator when filters are active

4. **UI/UX**
   - Tag picker dropdown on task detail/edit
   - Color palette for tag colors (8-10 preset colors)
   - Smooth animations for tag additions
   - Responsive design for mobile

## Tech Approach
- Add `tags` table in Prisma schema
- Create Tag model and API routes
- Add tag management UI (settings panel)
- Update TaskCard component to show tags
- Add filter dropdown in KanbanBoard
- Use existing auth from Nexus

## Priority
High - Essential for task organization

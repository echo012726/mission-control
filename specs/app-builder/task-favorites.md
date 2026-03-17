# Feature Spec: Task Favorites/Star

## Feature Name
Task Favorites/Star

## Description
Add the ability to mark tasks as favorites/starred for quick access. Starred tasks appear in a dedicated "Favorites" view and are highlighted throughout the app.

## Acceptance Criteria

1. **Star Toggle**
   - Star/unstar tasks from task card (click star icon)
   - Star/unstar from task detail modal
   - Visual indicator (filled star vs outline) on task cards
   - Star state persists in database

2. **Favorites View**
   - New "Favorites" tab/filter in Kanban board
   - Shows all starred tasks across all lanes
   - Quick unstar action available
   - Sort by date starred, priority, or due date

3. **Visual Enhancements**
   - Star icon with gold/yellow color when active
   - Subtle highlight/border on starred task cards
   - Star count badge in sidebar or header
   - Animated star toggle

4. **Filtering**
   - Filter to show only starred tasks
   - Clear filter to return to normal view

## Tech Approach
- Add `starred` boolean field to Task model in Prisma (default false)
- Create API endpoint to toggle star status
- Update TaskCard to show star icon
- Add Favorites filter option in KanbanBoard
- Update task query to support starred filter

## Priority
Medium - Nice to have for task prioritization

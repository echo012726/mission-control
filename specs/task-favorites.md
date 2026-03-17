# Feature Spec: Task Favorites/Star

## Feature Name
Task Favorites/Star

## Description
Add the ability to mark tasks as favorites/starred for quick access. Starred tasks appear in a dedicated "Favorites" view and are highlighted throughout the app.

## Acceptance Criteria

1. **Star Toggle**
   - [x] Star/unstar tasks from task card (click star icon)
   - [x] Star/unstar from task detail modal
   - [x] Visual indicator (filled star vs outline) on task cards
   - [x] Star state persists in database

2. **Favorites View**
   - [x] Already exists: "starred" filter in QuickFilters
   - [x] Shows all starred tasks across all lanes

3. **Visual Enhancements**
   - [x] Star icon with gold/yellow color when active
   - [x] Subtle highlight/border on starred task cards
   - [x] Star count badge in sidebar (in QuickFilters counts)

4. **Filtering**
   - [x] Filter to show only starred tasks (already exists)
   - [x] Clear filter to return to normal view

## Tech Approach
- [x] `starred` boolean field already exists in Task model (default false)
- [x] PATCH API endpoint already supports starred toggle
- [x] GET endpoint supports `?starred=true` filter
- **TODO:** Add star icon button to task card UI
- **TODO:** Add starred property display in task card
- **TODO:** Add API call to toggle starred status

## Priority
Medium - Nice to have for task prioritization

## Implementation Notes
- Backend already supports starred field
- QuickFilters already has starred count and filter
- Need to add UI toggle in KanbanBoard task cards

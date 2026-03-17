# Task Relationships - Feature Specification

## Overview
Add the ability to link tasks together with relationship types (blocks, blocked by, relates to, duplicates). This enables better dependency tracking and workflow management.

## Features

### 1. Task Relationship Types
- **Blocks**: Task A prevents Task B from starting
- **Blocked By**: Task A cannot proceed until Task B completes
- **Relates To**: Task A is related to Task B (general connection)
- **Duplicates**: Task A duplicates Task B (already partially implemented via Task Duplication)

### 2. UI Components
- Relationship selector in task edit modal
- Relationship badge on task cards showing linked count
- Click badge to see linked tasks popup
- Visual indicators on cards showing relationship type

### 3. Data Structure
```javascript
{
  "taskRelationships": {
    "taskId-1": [
      { "targetId": "taskId-2", "type": "blocks" },
      { "targetId": "taskId-3", "type": "relates_to" }
    ]
  }
}
```

### 4. Interactions
- Add relationship: Select task + relationship type + target task
- Remove relationship: Click X on relationship
- View relationships: Click badge or expand in edit modal
- Filter: Filter tasks by relationship (e.g., "show my blocked tasks")

## Acceptance Criteria
- [ ] Can add relationship to any task
- [ ] Can select from 3 relationship types (blocks, blocked_by, relates_to)
- [ ] Relationship count badge shows on task cards
- [ ] Clicking badge shows linked tasks popup
- [ ] Relationships persist to localStorage
- [ ] Can remove relationships
- [ ] Visual distinction between relationship types (different colors)

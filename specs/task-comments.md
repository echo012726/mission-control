# Task Comments Feature Specification

## Overview
Add the ability to attach comments/notes to tasks for collaboration and context.

## Features

### Core Functionality
- **Add Comment**: Text input on task detail modal to add comments
- **Comment Display**: Show comments in chronological order on task detail
- **Timestamp**: Each comment shows author and timestamp
- **Edit/Delete**: Users can edit or delete their own comments
- **Character Count**: Show character count for comments (max 1000 chars)

### UI Components
- **Comments Section**: Collapsible section in task detail modal
- **Comment Input**: Multi-line textarea with submit button
- **Comment List**: Scrollable list of comments with avatars/initials
- **Empty State**: Prompt to add first comment

### Data Model
```javascript
{
  taskId: string,
  comments: [
    {
      id: string,
      text: string,
      author: string,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]
}
```

### Storage
- Store in localStorage under `mc_task_comments` key
- Auto-save on comment add/edit/delete

## Acceptance Criteria
- [ ] Comments section visible in task detail modal
- [ ] Can add new comment with text
- [ ] Comments display with author and timestamp
- [ ] Can edit existing comments
- [ ] Can delete comments
- [ ] Comments persist after page refresh
- [ ] Empty state shows when no comments
- [ ] Character limit enforced (1000 chars)

# Advanced Search Feature

## Feature: Advanced Search with Query Operators
- **Priority:** HIGH
- **Status:** ✅ IMPLEMENTED
- **Description:** Powerful search modal with query operators like "due:today", "priority:high", "label:urgent"

## Search Operators Supported

### Status Operators
- `status:inbox` - Tasks in inbox
- `status:planned` - Planned tasks
- `status:progress` or `status:inprogress` - In progress tasks
- `status:blocked` - Blocked tasks
- `status:done` - Completed tasks

### Priority Operators
- `priority:high` or `p:high` - High priority
- `priority:medium` or `p:medium` - Medium priority
- `priority:low` or `p:low` - Low priority

### Date Operators
- `due:today` - Tasks due today
- `due:tomorrow` - Tasks due tomorrow
- `due:week` - Tasks due this week
- `due:overdue` - Overdue tasks
- `due:2026-03-15` - Tasks due on specific date
- `due:today+3` - Tasks due in 3 days

### Label/Tag Operators
- `label:urgent` - Tasks with "urgent" label
- `tag:work` - Tasks with "work" tag
- `has:label` - Tasks with any label
- `has:due` - Tasks with due date
- `has:attachment` - Tasks with attachments

### Text Search
- `"exact phrase"` - Exact phrase match
- `word1 AND word2` - Both words present
- `word1 OR word2` - Either word present
- `-word` - Exclude word

## Implementation

### Files to Create/Modify
- `/src/components/AdvancedSearchModal.tsx` - New modal component
- `/src/components/KanbanBoard.tsx` - Add keyboard shortcut (/) for advanced search
- `/src/lib/searchParser.ts` - Parse search query into filters

## Acceptance Criteria
- [x] Modal opens with / key or click search icon
- [x] Parse query operators into structured filters
- [x] Real-time preview of matching tasks
- [x] Click result to navigate to task
- [x] Works with existing search system

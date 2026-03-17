# Subtask Templates - Feature Specification

## Overview
- **Feature:** Subtask Templates
- **App:** Mission Control
- **Priority:** Medium
- **Status:** To Build
- **Created:** 2026-03-12

## Problem
Users frequently create tasks that have the same set of sub-tasks (e.g., "Write blog post" → outline, draft, edit, publish). They need a way to quickly create tasks from reusable templates.

## Solution
Add subtask templates that let users:
1. Create and save templates with predefined sub-tasks
2. Apply templates when creating new tasks
3. Edit/delete templates
4. Reorder sub-tasks within templates

## UI/UX Specification

### Template Management Panel
- **Location:** Sidebar or modal (accessible via "Templates" button)
- **Components:**
  - "Create Template" button
  - List of saved templates with name + sub-task count
  - Edit/Delete icons per template

### Template Editor (Modal)
- Template name input
- Sub-task list with:
  - Sub-task title input
  - Add sub-task button
  - Delete sub-task (X button)
  - Drag handle for reordering
- Save/Cancel buttons

### Task Creation Flow
- When creating a task, show "Add from Template" dropdown
- Selecting a template populates sub-tasks automatically

### Visual Design
- Match existing dark theme (#1a1a2e background)
- Accent color: #00d9ff (cyan)
- Template cards: #0f3460 background
- Smooth animations for expand/collapse

## Functionality

### Core Features
1. **Create Template:** Name + list of sub-task titles
2. **Apply Template:** One-click to add all sub-tasks to a task
3. **Edit Template:** Modify name and sub-tasks
4. **Delete Template:** Remove with confirmation
5. **Template Storage:** LocalStorage for persistence

### Data Structure
```javascript
{
  templates: [
    {
      id: "uuid",
      name: "Blog Post",
      subTasks: [
        { id: "uuid", title: "Outline" },
        { id: "uuid", title: "Write Draft" },
        { id: "uuid", title: "Edit" },
        { id: "uuid", title: "Publish" }
      ],
      createdAt: "timestamp"
    }
  ]
}
```

## Acceptance Criteria
- [ ] User can create a new template with name and sub-tasks
- [ ] User can apply template to any task
- [ ] Applied template creates all sub-tasks on the task
- [ ] User can edit existing templates
- [ ] User can delete templates with confirmation
- [ ] Templates persist across page reloads (localStorage)
- [ ] UI matches existing dark theme
- [ ] Works on both desktop and mobile

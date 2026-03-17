# Gmail Integration - Implementation Spec

## Overview
Sync tasks with Gmail - create tasks from emails, link emails to tasks, see email context in tasks.

## Features
1. **Link Email to Task** - Paste Gmail link onto a task, show email preview
2. **Create Task from Email** - Quick-add task with email subject/body
3. **Email Thread View** - See linked emails in task detail panel

## Implementation Steps

### 1. Database Schema Update
- Add `gmailThreadId` field to Task model (optional link to email)

### 2. Backend API
- POST /api/tasks/[id]/link-email - Link email to task
- DELETE /api/tasks/[id]/link-email - Unlink email
- GET /api/gmail/auth - OAuth flow (reuse existing Google Account)

### 3. Frontend
- Add email link button in task detail modal
- Display linked email preview in task card/modal
- "Create from Gmail" quick action (future)

## Acceptance Criteria
1. Can paste Gmail link onto any task
2. Shows email subject/sender in task view
3. Works with existing Google Calendar auth

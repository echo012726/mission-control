# Webhooks Implementation Plan

## Overview
Trigger webhooks when Mission Control events occur (task created, updated, completed, etc.)

## Backend Implementation

### 1. Create webhook trigger utility
- File: `/src/lib/webhooks.ts`
- Function: `triggerWebhooks(event: string, data: any)`
- Fetches all enabled webhooks subscribed to the event
- Sends POST request to each webhook URL with payload
- Supports optional HMAC signature using secret

### 2. Integrate into task CRUD
- Task creation (`POST /api/tasks`) → trigger `task_created`
- Task update (`PATCH /api/tasks/[id]`) → trigger `task_updated`
- Task status change to "done" → trigger `task_completed`

### 3. Test webhook delivery
- Verify webhooks fire correctly
- Check payload format

## Status: ✅ COMPLETE

## Implementation Notes
- [x] lib/webhooks.ts has trigger functions (triggerTaskCreated, triggerTaskUpdated, triggerTaskCompleted, triggerTaskMoved)
- [x] Task POST triggers task_created webhook
- [x] Task PATCH triggers task_updated and task_completed webhooks
- [x] WebhookPanel UI for managing webhooks
- [x] Supports HMAC signature verification

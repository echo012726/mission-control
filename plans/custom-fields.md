# Custom Fields Enhancement - Implementation Plan

## Task Selected
- **ID**: e1fd3432-7c02-484b-8b4e-568345431bc8
- **Title**: Custom Fields - Add your own fields like Customer, Project
- **Status**: planned
- **Priority**: medium

## Overview
Allow users to add custom key-value fields to tasks, enabling categorization beyond tags and labels (e.g., Customer Name, Project Code, Budget, etc.)

## Implementation Steps

### 1. Database Schema Update
- Add `customFields` JSON field to Task model in Prisma schema
- Field stores array of objects: `{ key: string, value: string, type: string }`
- Types: text, number, date, select

### 2. API Updates
- **GET /api/tasks**: Already returns all task fields - customFields will be included
- **POST /api/tasks**: Accept `customFields` in request body
- **PUT /api/tasks/[id]**: Accept `customFields` for updates
- Handle serialization/deserialization of JSON

### 3. Frontend Components
- **TaskDetailModal**: Add "Custom Fields" section
- **AddFieldButton**: Button to add new custom field
- **CustomFieldInput**: Inline editing for field key/value
- **FieldTypeSelector**: Dropdown for field type (text, number, date)

### 4. UI/UX
- Custom fields displayed below description in task modal
- Click to edit inline
- Add/remove field buttons
- Field types determine input type (text input, number input, date picker)

## Files to Modify
1. `prisma/schema.prisma` - Add customFields field
2. `src/app/api/tasks/route.ts` - Handle customFields in POST
3. `src/app/api/tasks/[id]/route.ts` - Handle customFields in PUT
4. `src/components/TaskModal.tsx` or similar - Add UI

## Status: ✅ COMPLETE

## Implementation Notes
- [x] Schema has customFields JSON field
- [x] API accepts customFields in POST/PATCH
- [x] KanbanBoard has full custom fields UI (add/edit/delete)
- [x] Supports field types: text, number, date, select

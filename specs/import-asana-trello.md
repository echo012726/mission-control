# Import from Other Tools (Asana, Trello) - SPEC.md

## Feature Overview
- **Feature:** Import tasks from Asana and Trello JSON exports
- **Type:** Data Import / Migration
- **Priority:** Medium
- **Status:** To Implement

## Overview
Allow users to import tasks from Asana and Trello JSON exports into Mission Control. Users upload their exported JSON files and the system parses and creates tasks with appropriate field mapping.

## Requirements

### 1. Import API Endpoints
- `POST /api/import/asana` - Import Asana JSON export
- `POST /api/import/trello` - Import Trello JSON export
- `GET /api/import/validate` - Validate import file before import

### 2. Supported Formats

#### Asana Import
Expected JSON structure (Asana data export format):
- `data` array containing tasks
- Each task has: `gid`, `name`, `notes`, `completed`, `due_on`, `assignee`, `memberships` (sections/projects), `tags`

Field Mapping:
- `name` → `title`
- `notes` → `description`
- `completed: true` → `status: "done"`, otherwise `status: "planned"`
- `due_on` → `dueDate`
- `memberships[].section.name` → lane/status mapping
- `tags` → `tags`

#### Trello Import
Expected JSON structure (Trello JSON export):
- `cards` array within each `list`
- Each card has: `id`, `name`, `desc`, `due`, `closed`, `idList`, `labels`, `idMembers`

Field Mapping:
- `name` → `title`
- `desc` → `description`
- `closed: true` → skip (archived) or mark done
- `due` → `dueDate`
- `idList` → map to status based on list name
- `labels` → `tags`

### 3. UI Components
- Import button in Settings/Export page
- File upload component (drag & drop support)
- Import preview showing: task count, sample tasks
- Import progress indicator
- Success/error summary

### 4. Features
- Duplicate detection (by title + date)
- Selective import (choose which tasks to import)
- Field mapping options
- Clear mapping instructions for users

### 5. Data Handling
- Skip archived/completed tasks (optional toggle)
- Map priorities if available
- Preserve original IDs in custom fields for reference
- Handle missing fields gracefully

## Technical Implementation

### Database
- Add optional fields to Task model for external IDs:
  - `asanaId` (String, unique)
  - `asanaProjectId` (String)
  - `trelloId` (String, unique)
  - `trelloBoardId` (String)
  - `trelloListId` (String)

### API Routes
1. `/api/import/asana` - POST, accepts JSON file
2. `/api/import/trello` - POST, accepts JSON file
3. `/api/import/validate` - POST, validates file format

### Components
1. `ImportPanel.tsx` - Main import UI
2. `AsanaImport.tsx` - Asana-specific import
3. `TrelloImport.tsx` - Trello-specific import

## Acceptance Criteria
- [ ] Can upload and parse Asana JSON export
- [ ] Can upload and parse Trello JSON export
- [ ] Tasks are created in correct lanes based on status
- [ ] All relevant fields are mapped (title, description, due date, tags)
- [ ] Duplicate tasks are detected and handled
- [ ] Import shows preview before committing
- [ ] Success/error summary displayed after import
- [ ] Original external IDs preserved for reference

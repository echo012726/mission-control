# Custom Fields Feature Specification

## Overview
Allow users to define custom fields and attach them to tasks for flexible metadata.

## Features

### 1. Custom Field Definitions
- Define custom fields with types: text, number, date, select, checkbox
- Store field definitions in localStorage (`mc_custom_fields`)
- Default fields: Estimated Hours, Budget, Customer

### 2. Field Management UI
- "Custom Fields" button in header
- Modal to add/edit/delete field definitions
- Field name, type, and options (for select type)

### 3. Task Field Assignment
- Edit modal shows custom field inputs
- Fill in values for each defined field
- Values stored in localStorage (`mc_task_custom_fields`)

### 4. Display in Task Cards
- Show custom field values as small badges/chips
- Different styling per field type

### 5. Filtering
- Quick filter dropdown for custom field values
- Filter tasks by custom field criteria

## Data Structure

```javascript
// Field Definitions
{
  "field_1": { name: "Estimated Hours", type: "number" },
  "field_2": { name: "Priority", type: "select", options: ["Low", "Medium", "High"] },
  "field_3": { name: "Billable", type: "checkbox" }
}

// Task Field Values
{
  "task_123": { "field_1": 5, "field_2": "High", "field_3": true }
}
```

## Implementation
- Add custom fields button and modal to kanban.html
- Add CSS for custom field display
- Add JavaScript for CRUD operations
- Update task edit modal to include custom fields

## Status: ✅ COMPLETED - March 13, 2026

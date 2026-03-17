# Feature Specification: Task Template Library

## Overview
- **Feature Name:** Template Library
- **Type:** New Feature
- **Core Functionality:** Save task templates with预设 fields (title, description, tags, priority, due date, location, etc.) and quickly create tasks from templates
- **Target Users:** Power users who repeatedly create similar tasks

## UI/UX Specification

### Layout Structure
- **Template Library Page** (`/templates`) - Grid/list view of saved templates
- **Create Template Modal** - Form to save current task settings as template
- **Use Template Dropdown** - Quick-access in Quick Add and task creation

### Visual Design
- **Color Palette:** Use existing app colors (primary: slate/blue)
- **Typography:** Match existing sans-serif (Inter/system)
- **Spacing:** Consistent 16px base unit
- **Effects:** Subtle shadows on template cards, hover lift effect

### Components
1. **TemplateCard** - Displays template name, description, field preview
2. **CreateTemplateForm** - Title, description, default fields (tags, priority, due offset)
3. **UseTemplateButton** - Quick-create from template in task creation flow
4. **TemplateManager** - Edit/delete templates

## Functionality Specification

### Core Features
1. **Save as Template**
   - Save current task field values as template
   - Include: title pattern, description, tags, priority, due date offset, location, recurrence
   - Name and describe template

2. **Template Library**
   - View all saved templates
   - Edit template details
   - Delete templates
   - Duplicate templates

3. **Create from Template**
   - One-click task creation from template
   - Apply template defaults to new task
   - Option to customize before creating

4. **Template Variables**
   - `{today}` - Current date
   - `{tomorrow}` - Tomorrow's date
   - `{week}` - Next week date

### Data Model
```prisma
model TaskTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  titlePattern String?
  tags        String[] // Stored as JSON string
  priority    String?  // low, medium, high
  dueOffset   Int?     // Days from today
  locationName String?
  recurrence  String?  // Default recurrence setting
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### API Routes
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `PATCH /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template

## Acceptance Criteria
- [ ] User can save any task as a template with custom name
- [ ] Templates appear in dedicated library page
- [ ] User can create new task from template with one click
- [ ] Template variables are resolved when creating task
- [ ] Templates can be edited and deleted
- [ ] UI matches existing app style

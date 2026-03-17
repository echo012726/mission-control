# SPEC.md - Project Portfolios

## Feature Overview
- **Feature Name:** Project Portfolios
- **Type:** New Feature (Phase 2)
- **Core Functionality:** Group tasks into high-level projects/portfolios with aggregated views, budget tracking, and portfolio-level analytics
- **Target Users:** Teams and individuals managing multiple projects

## UI/UX Specification

### Layout Structure

**Portfolio Sidebar Panel**
- Collapsible panel on the left side of kanban board
- Width: 280px when expanded, 60px when collapsed
- Toggle button in header: 📁 Portfolio

**Portfolio Card**
- Displays: Name, task count, completion percentage, color indicator
- Hover: Shows quick stats (total tasks, completed, in-progress)
- Click: Filters kanban to show only tasks in that portfolio

**Portfolio Manager Modal**
- Tabbed interface: Portfolios | Settings | Analytics
- Create/Edit/Delete portfolios
- Assign tasks to portfolios via drag-drop or dropdown

### Visual Design

**Color Palette**
- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Purple)
- Accent: `#14b8a6` (Teal)
- Background: `#1e1e2e` (Dark) / `#f8fafc` (Light)
- Surface: `#2d2d3f` (Dark) / `#ffffff` (Light)
- Text Primary: `#f1f5f9` (Dark) / `#1e293b` (Light)
- Text Secondary: `#94a3b8` (Dark) / `#64748b` (Light)

**Portfolio Colors** (User-selectable)
- Blue: `#3b82f6`
- Green: `#22c55e`
- Orange: `#f97316`
- Pink: `#ec4899`
- Purple: `#a855f7`
- Cyan: `#06b6d4`
- Red: `#ef4444`
- Yellow: `#eab308`

**Typography**
- Font Family: System UI / Inter
- Headings: 600 weight
- Body: 400 weight
- Small: 12px

**Spacing**
- Base unit: 4px
- Component padding: 12px-16px
- Card gap: 8px
- Section gap: 24px

### Components

**PortfolioList**
- Scrollable list of portfolio cards
- "All Tasks" option at top (default view)
- "Add Portfolio" button at bottom
- Collapse/expand toggle

**PortfolioCard**
- States: Default, Hover, Selected, Empty
- Shows: Color dot, name, task count badge, progress ring
- Click action: Filter kanban to portfolio

**PortfolioModal**
- Modal for creating/editing portfolios
- Fields: Name, Description, Color, Budget (hours)
- Task assignment area with search/filter
- Save/Cancel/Delete buttons

**PortfolioHeader**
- Shows when portfolio is selected
- Breadcrumb: All Tasks > Portfolio Name
- Portfolio stats: Tasks, Completed, Hours logged
- "Edit Portfolio" and "Exit Portfolio" buttons

### Animations
- Panel slide: 200ms ease-out
- Card hover: Scale 1.02, 150ms
- Modal fade: 150ms
- Progress ring: Animated on load

## Functionality Specification

### Core Features

1. **Create Portfolio**
   - Name (required, max 50 chars)
   - Description (optional, max 200 chars)
   - Color (8 preset options)
   - Budget hours (optional, number)

2. **Assign Tasks**
   - Multi-select tasks in kanban view
   - "Assign to Portfolio" dropdown
   - Or drag tasks to portfolio in sidebar
   - One task = one portfolio (no multi-assignment)

3. **Portfolio Views**
   - Filter kanban by portfolio
   - Aggregated task counts
   - Completion percentage
   - Total hours tracked vs budget

4. **Portfolio Analytics**
   - Tasks by status (pie chart)
   - Completion trend over time
   - Time spent vs budget
   - Top contributors (if team)

5. **Quick Actions**
   - Click portfolio to filter
   - Right-click for context menu (Edit, Delete, Archive)
   - Keyboard: Ctrl+P to open portfolio panel

### User Interactions

- **Create:** Click "+ Add Portfolio" → Modal opens → Fill form → Save
- **Assign:** Select task(s) → Click "Assign" → Choose portfolio → Confirm
- **View:** Click portfolio card → Kanban filters to show portfolio tasks
- **Edit:** Right-click portfolio → Edit → Modal opens → Modify → Save
- **Delete:** Right-click portfolio → Delete → Confirm → Remove (tasks unassigned, not deleted)

### Data Handling

**localStorage Schema:**
```json
{
  "portfolios": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "color": "#hex",
      "budgetHours": "number|null",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "taskPortfolioAssignments": {
    "taskId": "portfolioId"
  }
}
```

### Edge Cases
- Deleting portfolio: Confirm dialog, tasks unassigned (not deleted)
- Moving task to different portfolio: Overwrites previous assignment
- Empty portfolio: Show "No tasks" message with prompt to assign
- Budget exceeded: Visual warning (orange), then red when 20%+ over

## Acceptance Criteria

- [ ] Portfolio panel toggles open/closed
- [ ] Can create new portfolio with name, description, color
- [ ] Can edit existing portfolio
- [ ] Can delete portfolio (with confirmation)
- [ ] Can assign single task to portfolio via dropdown
- [ ] Can assign multiple selected tasks
- [ ] Clicking portfolio filters kanban to show only its tasks
- [ ] "All Tasks" shows unfiltered view
- [ ] Portfolio card shows task count and completion %
- [ ] Budget field accepts hours and shows vs actual comparison
- [ ] Portfolio persists to localStorage
- [ ] Works in both dark and light mode
- [ ] Responsive: Panel overlays on mobile, side-by-side on desktop

# Budget & Time Budget - Feature Specification

## Overview
Add budget tracking capabilities to Mission Control, allowing users to set time budgets for projects and track estimated vs actual time spent.

## Features

### 1. Project Budget Settings
- Set time budget per project (in hours)
- Track estimated hours vs actual hours spent
- Budget progress bar with color coding (green/yellow/red)
- Over-budget alerts and warnings

### 2. Budget Dashboard
- Overview of all project budgets
- Total budget vs total spent across all projects
- Budget health indicators
- Sort by budget status (over, on-track, under)

### 3. Time Entry Integration
- Link time tracked (via existing Time Tracking feature) to projects
- Automatic calculation of actual hours from time logs
- Manual time entry with project assignment

### 4. Budget Reports
- Monthly budget summary
- Project-by-project breakdown
- Export budget reports

## Data Model

```javascript
// Project Budget
{
  id: string,
  projectId: string,
  projectName: string,
  budgetHours: number,        // Planned hours
  spentHours: number,         // Actual hours (calculated from time logs)
  startDate: string,
  endDate: string,
  createdAt: timestamp
}

// Time Entry with project
{
  id: string,
  taskId: string,
  projectId: string,
  minutes: number,
  date: string,
  description: string
}
```

## UI Components

1. **Budget Settings Modal** - Set budget for a project
2. **Budget Overview Panel** - Shows all project budgets on dashboard
3. **Project Budget Card** - Individual project budget with progress bar
4. **Budget Alert Badge** - Shows when over budget

## Acceptance Criteria
- [ ] Can set budget hours for a project
- [ ] Budget progress displays correctly
- [ ] Over-budget warnings appear
- [ ] Budget data persists to localStorage
- [ ] Integrates with existing time tracking
- [ ] Budget overview visible on dashboard

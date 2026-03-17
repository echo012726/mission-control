# Time Tracking Reports - Feature Specification

## Overview
Add comprehensive time tracking reports to Mission Control, allowing users to analyze their time spent across tasks, tags, priorities, and time periods.

## Features

### 1. Time Reports API (`/api/time-reports`)
- **GET /api/time-reports** - Fetch time tracking reports
  - Query params: `type` (daily|weekly|monthly|byTag|byPriority|byStatus), `startDate`, `endDate`
  - Returns aggregated time data with breakdowns

### 2. Time Reports Page (`/time-reports`)
- Date range selector (Today, This Week, This Month, Custom)
- Report type tabs (Overview, By Tag, By Priority, By Status, By Day)
- Summary cards (Total time, Avg per day, Most productive day, Top tag)
- Bar/line charts for visualization
- Export to CSV option

### 3. Timer Controls
- Start/Stop timer button in task modal
- Visual indicator when timer is running
- Current session time display

## Technical Implementation

### API Response Format
```json
{
  "type": "weekly",
  "startDate": "2026-03-06",
  "endDate": "2026-03-12",
  "totalTime": 36000,
  "avgPerDay": 5142,
  "tasksCount": 25,
  "breakdown": [
    { "label": "Monday", "value": 7200 },
    { "label": "Development", "value": 14400, "tags": [...] }
  ]
}
```

## Priority
High - Valuable for productivity analysis

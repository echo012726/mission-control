# Weekly Report Enhancement Plan

## Task ID
94cb0382-587f-4a1f-b24c-cd8f0a03d175

## Overview
Auto-summarize what got done each week - a weekly report feature for Mission Control.

## Implementation Plan

### 1. API Endpoint: /api/weekly-report
Create a new API route that returns:
- **Week range**: Start and end dates of the week
- **Tasks completed**: Count and list of completed tasks
- **Tasks created**: Count and list of new tasks
- **Completion rate**: % of tasks completed vs created
- **By status**: Breakdown of current task counts
- **By priority**: Breakdown of tasks by priority level
- **Top tags**: Most frequently used tags this week
- **Daily breakdown**: Day-by-day activity for the week
- **Streak info**: Current streak if applicable

### 2. UI Component: WeeklyReportPanel
- Display in Dashboard or dedicated tab
- Show week selector (current week, previous weeks)
- Card-based layout with key metrics
- Expandable task lists

### 3. Integration
- Add to existing dashboard tab
- Optionally auto-generate every Sunday

## Data Sources
- Prisma Task model
- Prisma ActivityLog model (for detailed tracking)

## Acceptance Criteria
- [x] API returns weekly statistics for current week
- [x] Can view previous weeks' reports
- [x] UI displays completed vs created task counts
- [x] Shows daily breakdown chart
- [x] Responsive design
- [x] Integrated into main navigation

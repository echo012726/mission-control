# Goal/OKR Tracking - Implementation Plan

## Feature Overview
Add Goal and Objective Key Results (OKR) tracking to Mission Control, allowing users to:
- Create high-level goals with measurable key results
- Link tasks to goals/OKRs
- Track progress automatically based on completed tasks
- Visualize goal completion with progress bars

## Data Structure

### Goal
- id: string
- title: string
- description: string
- targetDate: Date
- progress: number (0-100, auto-calculated)
- keyResults: KeyResult[]
- tasks: string[] (task IDs linked to this goal)
- createdAt: Date
- updatedAt: Date

### KeyResult
- id: string
- title: string
- targetValue: number
- currentValue: number
- unit: string (%, $, tasks, etc.)
- weight: number (for overall goal calculation)

## UI Components

1. **Goals Panel** - Slide-out panel showing all goals with progress
2. **Goal Card** - Individual goal display with key results
3. **Goal Selector** - Dropdown in task edit to link to goal
4. **Goal Progress Widget** - Dashboard widget showing goal stats

## API Endpoints

- `GET /api/goals` - List all goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/keyresults` - Add key result
- `PUT /api/goals/:id/tasks` - Link tasks to goal

## Acceptance Criteria

- [ ] Can create goals with title, description, target date
- [ ] Can add key results with target values
- [ ] Can link tasks to goals
- [ ] Progress auto-calculates from key results / completed tasks
- [ ] Goals visible in dashboard widget
- [ ] Tasks show goal linkage indicator
- [ ] Data persists to localStorage (MVP)

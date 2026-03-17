# Streaks Feature Specification

## Overview
Track daily task completion streaks to gamify productivity.

## Data Model
Add a `DailyStreak` model to track completions per day:
- `id`: UUID
- `date`: Date (unique, ISO date string)
- `completedCount`: Number of tasks completed that day
- `createdAt`: DateTime

## API Endpoints

### GET /api/streaks
Returns streak data:
- current streak count
- longest streak count
- today's completion count
- last 30 days of data for visualization

### POST /api/streaks
Called when a task is marked complete - increments that day's count.

## UI Component
- Simple widget showing 🔥 streak count
- Visual calendar/grid of last 30 days

## Implementation Steps
- [ ] Add DailyStreak model to schema
- [ ] Run migration
- [ ] Create API route
- [ ] Add webhook/call to update streak on task completion
- [ ] Add StreaksWidget to dashboard

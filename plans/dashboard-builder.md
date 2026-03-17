# Dashboard Builder Implementation Spec

## Overview
Add persistence to the dashboard widget layout so users' customizations are saved across sessions. Also add widget configuration options.

## Widgets can be dragged Current State
-, added, removed via UI
- Layout stored only in React state (lost on refresh)
- No widget configuration options

## Implementation Steps

### 1. Backend API
- [x] Create `PATCH /api/dashboard` endpoint to save widget layout (using PUT /api/dashboards/[id])
- [x] Add `dashboardConfig` column to tasks table or create new table (DashboardConfig model exists)
- [x] Return saved config on GET

### 2. Frontend Integration
- [x] Load saved widget layout on component mount
- [x] Save layout automatically when widgets change (add/remove/reorder)
- [x] Persist to backend via API

### 3. Widget Configuration
- [x] Add settings gear icon on widgets that support config
- [x] For WeatherWidget: allow setting location
- [x] Save widget-specific settings to backend

## Widget Types Supporting Configuration
- Weather: location (city name)
- (Future: Passive Income date range, etc.)

## Acceptance Criteria
1. ✅ Widget layout persists after page refresh
2. ✅ Adding/removing/reordering widgets auto-saves
3. ✅ Weather widget allows changing location via settings
4. ✅ Works for unauthenticated (default) user context

## Status: ✅ COMPLETE (March 8, 2026)

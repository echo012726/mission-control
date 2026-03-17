# Multiple Dashboards - Implementation Spec

## Overview
Allow users to create and switch between multiple dashboard layouts for different contexts (work, personal, projects, etc.)

## Current State
- Single dashboard with saved widget layout
- No support for multiple named dashboards

## Implementation Steps

### 1. Database Schema Update
- Add `name` field to DashboardConfig model (for identification)
- Add `isDefault` field to mark default dashboard
- Support multiple dashboard configs per user

### 2. Backend API Updates
- GET /api/dashboards - List all dashboards
- POST /api/dashboards - Create new dashboard
- GET /api/dashboards/[id] - Get specific dashboard
- PUT /api/dashboards/[id] - Update dashboard
- DELETE /api/dashboards/[id] - Delete dashboard
- POST /api/dashboards/[id]/set-default - Set as default

### 3. Frontend Updates
- Dashboard selector dropdown in header
- "Add Dashboard" button
- Rename/delete dashboard options
- Switch between dashboards instantly
- Copy layout from another dashboard

## Acceptance Criteria
1. Can create named dashboards
2. Can switch between dashboards
3. Widget layouts persist per dashboard
4. Can set a default dashboard
5. Can delete dashboards (except last one)

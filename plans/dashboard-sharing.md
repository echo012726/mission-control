# Dashboard Sharing - Implementation Spec

## Overview
Allow users to share dashboard views via read-only links that can be accessed without authentication.

## Features
1. Generate unique shareable links for dashboards
2. Public endpoint to view shared dashboards (no auth required)
3. Option to set expiration on share links
4. Option to password-protect share links

## Implementation Steps

### 1. Database Schema Update
- Add `shareToken` field to DashboardConfig (unique, for shareable links)
- Add `shareExpiresAt` field (optional expiration)
- Add `sharePassword` field (optional password protection)

### 2. Backend API
- POST /api/dashboards/[id]/share - Generate share link
- DELETE /api/dashboards/[id]/share - Revoke share link
- GET /api/share/[token] - Public endpoint to view shared dashboard (no auth)

### 3. Frontend
- Add "Share" button in dashboard header
- Modal to configure share options (expiration, password)
- Copy link button
- View shared dashboard (when accessed via link)

## Acceptance Criteria
1. Can generate a shareable link for any dashboard
2. Shared link opens dashboard in read-only mode
3. Can revoke shared links
4. Can set expiration on links
5. Can optionally password-protect links

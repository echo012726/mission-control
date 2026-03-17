# Push Notifications - Specification

## Overview
Add push notification support to Mission Control for task reminders, due date alerts, and team mentions.

## Features

### 1. Push Notification API
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `DELETE /api/notifications/unsubscribe` - Unsubscribe from push notifications
- `POST /api/notifications/send` - Send a push notification (internal)
- `GET /api/notifications/settings` - Get notification preferences
- `PUT /api/notifications/settings` - Update notification preferences

### 2. Notification Types
- Task due date reminders (1 hour, 1 day before)
- Task assignment notifications
- Team mentions
- Workflow trigger notifications

### 3. Subscription Management
- Store push subscription (endpoint, keys)
- Support for multiple devices
- Enable/disable per notification type

### 4. Settings UI
- Toggle notifications on/off
- Configure reminder timing
- Choose notification types to receive

## Tech Stack
- Web Push API (standard)
- VAPID keys for authentication
- Service worker for receiving push events

## Implementation
1. Generate VAPID keys
2. Add subscription model to Prisma
3. Create notification API routes
4. Create service worker
5. Add settings UI component
6. Integrate with existing task/team features

## UI Components
- NotificationSettings component
- Push permission request banner
- Notification bell icon with badge

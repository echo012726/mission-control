# Calendar Integration Feature

## Feature: Two-way Google Calendar Sync
- **Priority:** HIGH 
- **Status:** ✅ COMPLETE (UI Integrated March 8, 2026)
- **Description:** Sync Mission Control tasks with Google Calendar for two-way calendar integration

## Implementation Plan

### Phase 1: Google OAuth Setup
- [x] Create Google Cloud project for Calendar API
- [x] Enable Google Calendar API
- [x] Set up OAuth 2.0 credentials
- [x] Add credentials to .env

### Phase 2: Backend API
- [x] Create `/api/calendar/auth` - OAuth flow initiation
- [x] Create `/api/calendar/callback` - OAuth callback handler
- [x] Create `/api/calendar/sync` - Sync tasks to Google Calendar
- [x] Create `/api/calendar/events` - Fetch events from Google Calendar
- [x] Create `/api/calendar/connect` - Connect/disconnect account

### Phase 3: Task Integration
- [x] Add `googleCalendarId` field to Task model
- [x] Update task creation to optionally create calendar event
- [x] Update task completion to mark calendar event complete
- [x] Handle calendar event updates back to tasks

### Phase 4: Frontend UI
- [x] Add Calendar Settings panel ✅ INTEGRATED March 8, 2026
- [x] Connect Google Account button
- [x] Sync Now button with last sync timestamp
- [x] Show calendar sync status in header

## Files to Create/Modify
- `/src/app/api/calendar/route.ts` - Main calendar API
- `/src/app/api/calendar/auth/route.ts` - OAuth initiation
- `/src/app/api/calendar/callback/route.ts` - OAuth callback
- `/src/app/api/calendar/sync/route.ts` - Sync operations
- `/src/components/CalendarSettings.tsx` - Settings UI
- `/prisma/schema.prisma` - Add googleCalendarId field if needed

## Environment Variables Needed
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3456/api/calendar/callback
```

## Acceptance Criteria
- [ ] User can connect their Google account
- [ ] Tasks with due dates sync to Google Calendar
- [ ] Calendar events appear as tasks in Mission Control
- [ ] Two-way sync keeps both systems in sync
- [ ] User can disconnect their Google account

# Location-based Reminders - Specification

## Overview
- **Feature:** Location-based task reminders that trigger when you arrive at or leave a specific location
- **Priority:** Low
- **Date:** March 12, 2026

## User Story
"As a user, I want to attach location reminders to tasks so that I get notified when I'm near a specific place (e.g., reminders to buy groceries when passing by a store)."

## UI/UX Specification

### Components

#### LocationPicker Component
- Search input for locations using geocoding
- Display selected location name and address
- Option to use current location (Geolocation API)
- Clear location button

#### LocationReminderModal
- Trigger type selector: "When arriving" / "When leaving"
- Radius slider (100m - 1km, default 500m)
- Location search/picker
- Enable/disable toggle

#### Task Card Enhancement
- Show location icon if location reminder set
- Tooltip showing location name and trigger type

### Pages
- **Task Detail:** Location reminder section in edit form
- **Task Create:** Location picker in new task form
- **Settings:** Manage saved locations (future)

## Functionality Specification

### Core Features
1. **Location attachment** - Attach a location to any task
2. **Trigger types** - Arrive at or leave location
3. **Radius setting** - Configurable geofence radius
4. **Browser Geolocation** - Use current GPS position
5. **Location search** - Search via Nominatim (free geocoding)
6. **Persistence** - Store location data in task record

### Data Model (Prisma)
```prisma
model Task {
  // ... existing fields
  locationName     String?
  locationAddress  String?
  locationLat      Float?
  locationLng      Float?
  locationRadius   Int?        // meters, default 500
  locationTrigger  String?      // 'arrive' | 'leave'
  locationEnabled  Boolean?    @default(false)
}
```

### API Endpoints
- `PATCH /api/tasks/[id]` - Update task with location data
- `POST /api/tasks` - Create task with location data
- `GET /api/geocode` - Geocode location search (proxy to Nominatim)

### Geocoding
- Use Nominatim (OpenStreetMap) - free, no API key
- Rate limit: 1 request/second
- Store coordinates with task

### Client-Side
- Geolocation API for current location
- Haversine distance calculation for geofence check
- Notification API for browser notifications

## Acceptance Criteria
- [ ] Can search and select a location when creating/editing a task
- [ ] Can use current GPS location
- [ ] Can set trigger type (arrive/leave)
- [ ] Can adjust radius (100m-1km)
- [ ] Location data persists with task
- [ ] Location indicator shows on task card
- [ ] Works on mobile (geolocation permission)

## Out of Scope (v1)
- Background location tracking (would require native app)
- Push notifications (browser notifications only when tab open)
- Saved locations library
- Map visualization

# Mission Control - Mobile App Specification

## Overview
React Native/Expo mobile app for Mission Control task management.

## Tech Stack
- Expo SDK 52
- React Native
- Expo Router (file-based routing)
- NativeWind (Tailwind CSS for RN)

## Core Features (MVP)
1. **Task List View** - View all tasks in kanban lanes
2. **Quick Task Create** - Add tasks quickly
3. **Task Detail View** - View/edit task details
4. **Dark Mode** - Automatic dark mode support
5. **Offline Support** - Cache tasks locally

## API Integration
- Connect to existing Mission Control API
- Token-based authentication
- Sync tasks on pull-to-refresh

## File Structure
```
mission-control-mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Tasks tab
│   │   └── settings.tsx   # Settings tab
│   ├── task/[id].tsx      # Task detail
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── lib/                   # API client, utils
└── package.json
```

## Implementation Steps
- [x] Step 1: Initialize Expo project
- [x] Step 2: Set up API client and auth
- [x] Step 3: Build task list UI with kanban lanes
- [x] Step 4: Add task creation flow
- [ ] Step 5: Implement task detail/edit
- [ ] Step 6: Add offline caching
- [ ] Step 7: Test and polish

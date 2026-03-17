# Focus Timer (Pomodoro) - SPEC.md

## Feature Overview
- **Name:** Focus Timer
- **Type:** Productivity Widget & Global Timer
- **Summary:** A Pomodoro-style focus timer that helps users concentrate on tasks with work/break cycles
- **Target Users:** Marcus and team members who want to improve focus

## UI/UX Specification

### Layout Structure
- **Widget:** Compact timer display (300x200px default)
- **Header Integration:** Small timer indicator in header showing remaining time
- **Modal:** Full focus session view with controls
- **Responsive:** Works on mobile and desktop

### Visual Design
- **Colors:**
  - Work mode: `#EF4444` (red-500) 
  - Break mode: `#22C55E` (green-500)
  - Long break: `#3B82F6` (blue-500)
  - Background: Dark mode compatible
- **Typography:** 
  - Timer digits: 48px bold monospace
  - Labels: 14px medium
- **Animations:** Pulse animation during active timer, smooth transitions between modes

### Components
1. **TimerDisplay:** Shows MM:SS countdown
2. **TimerControls:** Start/Pause, Reset, Skip buttons
3. **SessionIndicator:** Shows current session (Work 1/4, Break 1/4)
4. **TaskSelector:** Optional link to current task being worked on
5. **StatsDisplay:** Today's focus time, completed sessions

## Functionality Specification

### Core Features
1. **Timer Modes:**
   - Work session: 25 minutes (default)
   - Short break: 5 minutes
   - Long break: 15 minutes (after 4 work sessions)
   
2. **Controls:**
   - Start/Pause toggle
   - Reset current session
   - Skip to next phase
   - Custom duration settings

3. **Notifications:**
   - Browser notification when timer ends
   - Optional sound alert
   - Header badge updates

4. **Statistics:**
   - Sessions completed today
   - Total focus time today
   - Current streak

5. **Task Integration:**
   - Associate timer with specific task
   - Auto-log focus time to task

### Data Handling
- Store timer state in localStorage (persist on refresh)
- Track daily stats in localStorage
- Optional: Save to database for long-term analytics

### Edge Cases
- Browser tab inactive: Use Web Workers for accurate timing
- Page refresh: Restore timer state from localStorage
- Multiple timers: Only one active at a time

## Acceptance Criteria
- [x] Timer displays correctly in widget
- [x] Start/Pause/Reset work correctly
- [x] Browser notification fires on session complete
- [x] Timer persists across page refresh
- [x] Stats track correctly
- [x] Works in dark mode
- [x] Mobile responsive

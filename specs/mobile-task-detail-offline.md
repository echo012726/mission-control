# Mission Control Mobile - Task Detail & Offline Caching Spec

## Feature Overview
Complete the Mission Control mobile app by implementing task detail editing and offline caching.

## Selected Feature
**Continue Mobile App Development** - Complete task detail/edit screen and add offline caching

## UI/UX Specification

### Task Detail Screen
- **Navigation**: Tap task card → slide-up modal or new screen
- **Layout**:
  - Title (editable, large)
  - Description (multiline, editable)
  - Status/Lane selector (dropdown or buttons)
  - Priority selector (Low/Medium/High with color indicators)
  - Tags (chip display + add/remove)
  - Created/Updated timestamps (read-only)
  - Delete button (with confirmation)
- **Styling**: Dark mode, consistent with existing app (#1F2937 bg, #374151 cards)
- **Actions**: Save changes (emit via WebSocket for real-time sync)

### Offline Caching
- **Storage**: AsyncStorage for task cache
- **On Load**: Check cache first, then fetch fresh data
- **On Update**: Queue changes locally, sync when online
- **Sync Indicator**: Show pending sync count in header
- **Auto-sync**: When connection restored, flush queue

## Functionality Specification

1. **Task Detail View**
   - Tap task to open detail modal
   - Edit title, description, status, priority, tags
   - Save button persists to API + emits WebSocket event
   - Delete with confirmation dialog

2. **Offline Mode**
   - Cache tasks in AsyncStorage on load
   - Queue mutations when offline
   - Show "pending sync" badge when queue > 0
   - Auto-sync queue on reconnection

3. **Real-time Sync** (already implemented, integrate with detail)
   - Broadcast changes via collaboration lib
   - Listen for incoming changes, update UI

## Acceptance Criteria
- [ ] Tap task opens detail modal
- [ ] Can edit title, description, status, priority, tags
- [ ] Save persists to API + broadcasts via WebSocket
- [ ] Delete removes task with confirmation
- [ ] Tasks cached in AsyncStorage
- [ ] Offline indicator shows when no network
- [ ] Pending changes queue displayed
- [ ] Auto-sync on reconnection

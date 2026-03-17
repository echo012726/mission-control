# Auto-sync Todoist - Implementation Plan

## Selected Task
- **ID:** 88599228-ba2b-4cf7-81f3-53552e905b62
- **Title:** Auto-sync Todoist - Daily import of new tasks
- **Priority:** HIGH

## Current State
- Manual import script exists (`import_todoist.js`) - one-time import from JSON file
- Prisma schema lacks `todoistId` and `todoistProjectId` fields
- No Todoist API key configured in `.env`
- No scheduled job for daily sync

## Implementation Plan

### Phase 1: Schema & Config
1. Add todoist sync fields to Task model:
   - `todoistId` (String, optional, unique)
   - `todoistProjectId` (String, optional)
   - `todoistSyncedAt` (DateTime, optional)
2. Add TODOIST_API_KEY to `.env`
3. Run Prisma migration

### Phase 2: Todoist Service
1. Create `src/lib/todoist.ts` - Todoist API client
   - Fetch tasks from Todoist API
   - Map Todoist fields to Mission Control Task
   - Handle incremental sync (since timestamp)
2. Create `src/app/api/todoist/sync/route.ts` - Manual sync endpoint

### Phase 3: Scheduled Sync
1. Use existing CronJob model to schedule daily sync
2. Create `src/lib/todoist-cron.ts` - Cron job handler
3. Register daily cron at midnight

### Phase 4: UI (Future Enhancement)
- Show sync status in settings
- Manual "Sync Now" button
- View last sync time

## Next Steps
- [ ] Add todoist fields to schema.prisma
- [ ] Run prisma migration  
- [ ] Add TODOIST_API_KEY to .env
- [ ] Create todoist.ts service library
- [ ] Create sync API endpoint

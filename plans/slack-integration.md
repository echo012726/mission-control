# Slack Integration - Implementation Plan

## Goal
Build a complete Slack integration with real OAuth flow, webhooks, and task notifications.

## Scope
1. **OAuth Setup** - Slack app configuration, OAuth flow
2. **API Routes**
   - `GET /api/slack?action=status` - Connection status
   - `GET /api/slack?action=auth` - Initiate OAuth
   - `GET /api/slack?action=callback&code=XXX` - OAuth callback
   - `GET /api/slack?action=channels` - List channels
   - `POST /api/slack?action=disconnect` - Disconnect
   - `POST /api/slack?action=notify` - Send notifications
   - `POST /api/slack?action=settings` - Update settings
3. **UI Updates** - Real connection flow in SlackIntegration.tsx
4. **Database** - SlackAccount model in Prisma

## Status: ✅ COMPLETE

## Files Created/Modified
- `prisma/schema.prisma` - Added SlackAccount model
- `src/app/api/slack/route.ts` - Full API with OAuth
- `src/components/SlackIntegration.tsx` - Real OAuth UI
- `src/lib/slack.ts` - Notification utility + cron helper
- `.env.example` - Added Slack env vars

## Steps
- [x] 1. Add SlackAccount model to Prisma schema
- [x] 2. Create Slack OAuth API routes
- [x] 3. Update SlackIntegration component with real OAuth
- [x] 4. Add task -> Slack notification utility
- [x] 5. Test the integration (TypeScript compiles)

## To Use
1. Create Slack app at api.slack.com/apps
2. Add OAuth scopes: chat:write, channels:read, groups:read, incoming-webhook
3. Set redirect URI: http://localhost:3456/api/slack/callback
4. Add SLACK_CLIENT_ID and SLACK_CLIENT_SECRET to .env
5. Click "Connect" in Mission Control settings

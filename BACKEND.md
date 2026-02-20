# Mission Control Backend Modes

This repo now uses a backend abstraction for API routes (`/api/agents`, `/api/memories`, `/api/emails`, `/api/cron`) so development is **not blocked** by Convex auth.

## Default (no credentials needed)

Set this in `.env.local`:

```bash
MISSION_CONTROL_BACKEND=demo
```

- Works everywhere
- Returns safe demo data
- Never depends on local machine paths or cloud credentials

---

## OpenClaw local runtime mode (still no credentials)

If running on your own OpenClaw machine and you want live local data:

```bash
MISSION_CONTROL_BACKEND=openclaw
```

Optional path overrides are in `.env.example`.

---

## Convex switch-over (when auth/access is available)

When you are ready to move backend reads to Convex:

1. **Login locally**
   ```bash
   npx convex login
   ```
2. **Start/dev-sync Convex functions**
   ```bash
   npx convex dev
   ```
3. Copy deployment URL into `.env.local`:
   ```bash
   MISSION_CONTROL_BACKEND=convex
   NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
   # Optional for protected deployments:
   CONVEX_ADMIN_TOKEN=<token>
   ```
4. Restart Next.js dev server.

If Convex is unreachable or not configured, API routes safely fall back to demo data.

---

## Marcus: exact next local step

Right now, do this to unblock work immediately:

```bash
cp .env.example .env.local
# edit .env.local and keep:
MISSION_CONTROL_BACKEND=demo
npm run dev
```

Then switch to `openclaw` or `convex` later with no route-level code changes.

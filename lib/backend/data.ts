import fs from 'fs'
import path from 'path'

export type BackendMode = 'demo' | 'openclaw' | 'convex'

export interface MemoryRecord {
  id: string
  title: string
  content: string
  preview: string
  source: string
  createdAt: number
  updatedAt: number
}

export interface AgentRecord {
  id: string
  name: string
  role: string
  status: 'online' | 'busy' | 'away' | 'offline'
  currentTask: string
  lastActive: number | null
}

export interface EmailRecord {
  id: string
  from: string
  subject: string
  date: number
  preview: string
}

export interface CronRecord {
  id: string
  name: string
  schedule: string
  nextRun: number
  status: string
}

const DEMO_MEMORIES: MemoryRecord[] = [
  {
    id: 'demo-1',
    title: 'Mission Control bootstrap',
    content: 'Mission Control is running in demo backend mode. Switch to OpenClaw or Convex when ready.',
    preview: 'Mission Control is running in demo backend mode. Switch to OpenClaw or Convex when ready.',
    source: 'demo/bootstrap.md',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 10,
  },
]

const KNOWN_AGENTS = [
  { id: 'main', name: 'Echo', role: 'Main Orchestrator' },
  { id: 'coder', name: 'Coder', role: 'Development' },
  { id: 'researcher', name: 'Researcher', role: 'Research' },
  { id: 'executor', name: 'Executor', role: 'Automation' },
  { id: 'polybot', name: 'PolyBot', role: 'Trading' },
  { id: 'trading-strategist', name: 'Trading Strategist', role: 'Trading' },
  { id: 'reviewer', name: 'Reviewer', role: 'Code Review' },
  { id: 'debugger', name: 'Debugger', role: 'Debugging' },
] as const

const DEMO_AGENTS: AgentRecord[] = KNOWN_AGENTS.map((agent) => ({
  ...agent,
  status: 'offline',
  lastActive: null,
  currentTask: 'Demo backend mode',
}))

const DEMO_EMAILS: EmailRecord[] = []

const DEMO_CRON: CronRecord[] = [
  {
    id: 'daily-usage-report',
    name: 'Daily Usage Report',
    schedule: 'Daily 9pm PT',
    nextRun: Date.now() + 1000 * 60 * 60 * 12,
    status: 'active',
  },
  {
    id: 'weekly-summary',
    name: 'Weekly Summary',
    schedule: 'Sun 4am PT',
    nextRun: Date.now() + 1000 * 60 * 60 * 24 * 2,
    status: 'active',
  },
]

const OPENCLAW_MEMORY_DIR = process.env.OPENCLAW_MEMORY_DIR || '/root/.openclaw/workspace/memory'
const OPENCLAW_SESSIONS_FILE = process.env.OPENCLAW_SESSIONS_FILE || '/root/.openclaw/agents/main/sessions/sessions.json'
const OPENCLAW_MAILDIR_INBOX = process.env.OPENCLAW_MAILDIR_INBOX || '/root/Maildir/INBOX'

function getBackendMode(): BackendMode {
  const raw = (process.env.MISSION_CONTROL_BACKEND || 'demo').toLowerCase()
  if (raw === 'openclaw' || raw === 'convex' || raw === 'demo') return raw
  return 'demo'
}

function getConvexUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL
  return raw ? raw.replace(/\/$/, '') : null
}

function determineStatus(updatedAt: number): AgentRecord['status'] {
  const now = Date.now()
  const diff = now - updatedAt
  if (diff < 120000) return 'busy'
  if (diff < 600000) return 'away'
  if (diff < 3600000) return 'online'
  return 'offline'
}

function parseMail(filePath: string): EmailRecord | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fromMatch = content.match(/^From:\s*(.+)$/m)
    const subjectMatch = content.match(/^Subject:\s*(.+)$/m)
    const dateMatch = content.match(/^Date:\s*(.+)$/m)

    const bodyStart = content.indexOf('\n\n')
    const preview = bodyStart > 0 ? content.slice(bodyStart + 2).replace(/\n/g, ' ').slice(0, 140).trim() : ''

    let date = Date.now()
    if (dateMatch) {
      const parsed = new Date(dateMatch[1])
      if (!Number.isNaN(parsed.getTime())) date = parsed.getTime()
    }

    return {
      id: path.basename(filePath),
      from: fromMatch ? fromMatch[1].replace(/<.*>/, '').trim() : 'Unknown',
      subject: subjectMatch ? subjectMatch[1] : '(No Subject)',
      date,
      preview,
    }
  } catch {
    return null
  }
}

async function convexQuery<T>(fnPath: string, args: Record<string, unknown> = {}): Promise<T | null> {
  const baseUrl = getConvexUrl()
  if (!baseUrl) return null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (process.env.CONVEX_ADMIN_TOKEN) {
    headers.Authorization = `Bearer ${process.env.CONVEX_ADMIN_TOKEN}`
  }

  try {
    const response = await fetch(`${baseUrl}/api/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ path: fnPath, args }),
      cache: 'no-store',
    })

    if (!response.ok) return null

    const payload = await response.json()
    if (payload && typeof payload === 'object' && 'value' in payload) {
      return payload.value as T
    }

    return payload as T
  } catch {
    return null
  }
}

async function loadOpenClawMemories(): Promise<MemoryRecord[]> {
  if (!fs.existsSync(OPENCLAW_MEMORY_DIR)) return DEMO_MEMORIES

  const files = fs
    .readdirSync(OPENCLAW_MEMORY_DIR)
    .filter((f) => f.endsWith('.md'))
    .slice(0, 200)

  const memories: MemoryRecord[] = files.map((filename) => {
    const filePath = path.join(OPENCLAW_MEMORY_DIR, filename)
    const content = fs.readFileSync(filePath, 'utf-8')
    const stats = fs.statSync(filePath)
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : filename.replace(/\.md$/, '')
    const preview = content.slice(0, 500).replace(/[#*`]/g, '').trim()

    return {
      id: filename,
      title,
      content: content.slice(0, 5000),
      preview,
      source: `memory/${filename}`,
      createdAt: stats.birthtime.getTime(),
      updatedAt: stats.mtime.getTime(),
    }
  })

  return memories.sort((a, b) => b.updatedAt - a.updatedAt)
}

async function loadOpenClawAgents(): Promise<AgentRecord[]> {
  if (!fs.existsSync(OPENCLAW_SESSIONS_FILE)) return DEMO_AGENTS

  const raw = fs.readFileSync(OPENCLAW_SESSIONS_FILE, 'utf-8')
  const sessions = JSON.parse(raw)

  const activeAgents = Object.entries(sessions).map(([key, data]: [string, any]) => {
    const [, agentId] = key.split(':')
    return {
      id: agentId,
      status: determineStatus(data.updatedAt),
      lastActive: data.updatedAt,
      currentTask: data.origin?.label || 'Active session',
    }
  })

  return KNOWN_AGENTS.map((known) => {
    const active = activeAgents.find((agent) => agent.id === known.id)
    return {
      ...known,
      status: active?.status || 'offline',
      lastActive: active?.lastActive || null,
      currentTask: active?.currentTask || 'Idle',
    }
  })
}

async function loadOpenClawEmails(): Promise<EmailRecord[]> {
  const newDir = path.join(OPENCLAW_MAILDIR_INBOX, 'new')
  const curDir = path.join(OPENCLAW_MAILDIR_INBOX, 'cur')
  const existingDirs = [newDir, curDir].filter((dir) => fs.existsSync(dir))

  if (existingDirs.length === 0) return DEMO_EMAILS

  const emails: EmailRecord[] = []

  for (const dir of existingDirs) {
    const files = fs.readdirSync(dir).slice(0, 20)
    for (const filename of files) {
      const email = parseMail(path.join(dir, filename))
      if (email) emails.push(email)
    }
  }

  return emails.sort((a, b) => b.date - a.date).slice(0, 10)
}

async function loadConvexMemories(): Promise<MemoryRecord[] | null> {
  const rows = await convexQuery<any[]>('memories:getMemories')
  if (!Array.isArray(rows)) return null

  return rows
    .map((row) => {
      const content = String(row?.content || '')
      const title = String(row?.title || 'Untitled')
      const source = String(row?.source || 'convex/memories')
      const createdAt = Number(row?.createdAt || Date.now())
      const updatedAt = Number(row?.updatedAt || createdAt)

      return {
        id: String(row?._id || row?.id || title),
        title,
        content,
        preview: content.slice(0, 500),
        source,
        createdAt,
        updatedAt,
      }
    })
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

async function loadConvexAgents(): Promise<AgentRecord[] | null> {
  const rows = await convexQuery<any[]>('agents:getAgents')
  if (!Array.isArray(rows)) return null

  const mapped = rows.map((row) => {
    const rawStatus = String(row?.status || 'idle')
    const status: AgentRecord['status'] =
      rawStatus === 'working' ? 'busy' : rawStatus === 'waiting' ? 'away' : rawStatus === 'idle' ? 'online' : 'offline'

    return {
      id: String(row?._id || row?.id || row?.name || 'unknown'),
      name: String(row?.name || 'Unknown'),
      role: String(row?.role || 'Agent'),
      status,
      currentTask: String(row?.currentTask || 'Idle'),
      lastActive: Number(row?.lastActiveAt || Date.now()),
    }
  })

  return mapped.length ? mapped : DEMO_AGENTS
}

export async function getMemories(): Promise<MemoryRecord[]> {
  const mode = getBackendMode()

  if (mode === 'openclaw') return loadOpenClawMemories()
  if (mode === 'convex') return (await loadConvexMemories()) || DEMO_MEMORIES
  return DEMO_MEMORIES
}

export async function getAgents(): Promise<AgentRecord[]> {
  const mode = getBackendMode()

  if (mode === 'openclaw') return loadOpenClawAgents()
  if (mode === 'convex') return (await loadConvexAgents()) || DEMO_AGENTS
  return DEMO_AGENTS
}

export async function getEmails(): Promise<EmailRecord[]> {
  const mode = getBackendMode()

  if (mode === 'openclaw') return loadOpenClawEmails()
  return DEMO_EMAILS
}

export async function getCronJobs(): Promise<CronRecord[]> {
  return DEMO_CRON
}

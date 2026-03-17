import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { execSync } from 'child_process'
import fs from 'fs'

interface AgentState {
  id: string
  status: string
  lastHeartbeat?: number
  currentTask?: string
  error?: string
  model?: string
  kind?: string
  runtime?: string
  type?: string
  messageCount?: number
  createdAt?: number
  logs?: string[]
}

async function getOpenClawAgent(agentId: string): Promise<AgentState | null> {
  try {
    // Get live session data from OpenClaw CLI
    const output = execSync('openclaw sessions --json --active 60', { 
      encoding: 'utf-8',
      timeout: 10000 
    })
    
    const data = JSON.parse(output)
    const sessions = data.sessions || []
    const now = Date.now()
    
    // Find the matching session
    for (const session of sessions) {
      const sessionId = session.key as string || session.sessionId as string
      if (sessionId === agentId) {
        const ageMs = (session.ageMs as number) || 0
        const isActive = ageMs < 5 * 60 * 1000
        
        // Try to get logs for this agent
        const logs = await getAgentLogs(agentId)
        
        return {
          id: sessionId,
          status: isActive ? 'running' : 'idle',
          lastHeartbeat: now - ageMs,
          currentTask: session.kind === 'cron' ? 'Cron Job' : session.kind === 'group' ? 'Group Chat' : 'Direct Chat',
          model: session.model as string,
          kind: session.kind as string,
          runtime: session.model as string,
          type: session.kind as string,
          logs,
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching agent from OpenClaw:', error)
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const decodedId = decodeURIComponent(id)

  // Try to get from OpenClaw CLI
  const agent = await getOpenClawAgent(decodedId)
  
  if (agent) {
    return NextResponse.json(agent)
  }

  // Fallback: try state files
  const statePaths = [
    '/root/.openclaw/state/agents.json',
    '/var/lib/openclaw/agent-state.json',
    '/root/.openclaw/workspace/mission-control/agent-state.json',
    '/root/.openclaw/workspace-main/.openclaw/state.json',
  ]

  for (const statePath of statePaths) {
    try {
      if (fs.existsSync(statePath)) {
        const fileContent = fs.readFileSync(statePath, 'utf-8')
        if (!fileContent.trim()) continue
        
        const data = JSON.parse(fileContent)
        
        let agents: AgentState[] = []
        
        if (data.agents && Array.isArray(data.agents)) {
          agents = data.agents
        } else if (data.sessions) {
          agents = Object.entries(data.sessions).map(([agentId, session]: [string, unknown]) => {
            const s = session as Record<string, unknown>
            return {
              id: agentId,
              status: (s.status as string) || 'unknown',
              lastHeartbeat: s.lastHeartbeat as number | undefined,
              currentTask: s.currentTask as string | undefined,
              error: s.error as string | undefined,
            }
          })
        }

        const agentFromFile = agents.find(a => a.id === decodedId)
        if (agentFromFile) {
          const logs = await getAgentLogs(decodedId)
          return NextResponse.json({ ...agentFromFile, logs })
        }
      }
    } catch (e) {
      console.error(`Error reading state from ${statePath}:`, e)
    }
  }

  return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
}

async function getAgentLogs(agentId: string): Promise<string[]> {
  const logPaths = [
    `/root/.openclaw/logs/${agentId}.log`,
    `/var/log/openclaw/${agentId}.log`,
    `/root/.openclaw/workspace/mission-control/logs/${agentId}.log`,
  ]

  for (const logPath of logPaths) {
    try {
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf-8')
        // Return last 100 lines
        const lines = content.split('\n').filter(Boolean)
        return lines.slice(-100)
      }
    } catch (e) {
      // Continue to next path
    }
  }

  return []
}

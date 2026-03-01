import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

interface AgentState {
  id: string
  status: string
  lastHeartbeat?: number
  currentTask?: string
  error?: string
  config?: Record<string, unknown>
  sessions?: string[]
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

  // Try to find agent in various state locations
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

        const agent = agents.find(a => a.id === id)
        if (agent) {
          // Try to find logs for this agent
          const logs = await getAgentLogs(id)
          
          return NextResponse.json({
            ...agent,
            logs,
          })
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

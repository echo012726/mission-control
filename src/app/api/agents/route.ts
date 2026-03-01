import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs'

interface AgentState {
  id: string
  status: string
  lastHeartbeat?: number
  currentTask?: string
  error?: string
}

async function getOpenClawAgents(): Promise<AgentState[]> {
  const agents: AgentState[] = []
  
  // Try to read from OpenClaw state files
  const statePaths = [
    '/root/.openclaw/state/agents.json',
    '/var/lib/openclaw/agent-state.json',
    '/root/.openclaw/workspace/mission-control/agent-state.json', // Dev/Test path
    '/root/.openclaw/workspace-main/.openclaw/state.json',
  ]
  
  for (const statePath of statePaths) {
    try {
      if (fs.existsSync(statePath)) {
        const fileContent = fs.readFileSync(statePath, 'utf-8')
        if (!fileContent.trim()) continue
        
        const data = JSON.parse(fileContent)
        
        if (data.agents && Array.isArray(data.agents)) {
          return data.agents
        }
        
        if (data.sessions) {
          // Convert sessions object to array
          return Object.entries(data.sessions).map(([id, session]: [string, unknown]) => {
            const s = session as Record<string, unknown>
            return {
              id,
              status: (s.status as string) || 'unknown',
              lastHeartbeat: s.lastHeartbeat as number | undefined,
              currentTask: s.currentTask as string | undefined,
              error: s.error as string | undefined,
            }
          })
        }
      }
    } catch (e) {
      console.error(`Error reading state from ${statePath}:`, e)
      // Continue to next path
    }
  }

  // Return empty if no state found
  return agents
}

export async function GET() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agents = await getOpenClawAgents()

  return NextResponse.json(agents)
}

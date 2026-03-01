import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs'
import { execSync } from 'child_process'

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

export async function POST(request: Request) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { agentId, action } = await request.json()

    if (!agentId || !action) {
      return NextResponse.json({ error: 'agentId and action required' }, { status: 400 })
    }

    if (action !== 'start' && action !== 'stop') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Try to interact with OpenClaw CLI or sessions
    // This is a placeholder - actual implementation depends on OpenClaw's API
    try {
      if (action === 'start') {
        // Try to spawn a new agent session via OpenClaw
        // Note: This would require proper OpenClaw setup
        console.log(`Starting agent: ${agentId}`)
        
        // For now, we log the attempt - actual implementation would call:
        // openclaw sessions spawn --agent-id ${agentId}
        return NextResponse.json({ success: true, message: `Start signal sent for ${agentId}` })
      } else {
        // Try to stop an agent
        console.log(`Stopping agent: ${agentId}`)
        
        // For now, we log the attempt - actual implementation would call:
        // openclaw sessions kill ${agentId}
        return NextResponse.json({ success: true, message: `Stop signal sent for ${agentId}` })
      }
    } catch (execError) {
      console.error('Error executing agent control:', execError)
      return NextResponse.json({ error: 'Failed to execute agent control' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to provision agent', error)
    return NextResponse.json({ error: 'Failed to provision agent' }, { status: 500 })
  }
}

export async function GET() {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agents = await getOpenClawAgents()

  return NextResponse.json(agents)
}

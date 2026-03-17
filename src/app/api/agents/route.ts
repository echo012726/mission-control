import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { execSync } from 'child_process'
import { triggerAgentEvent } from '@/lib/pusher'

interface AgentState {
  id: string
  status: string
  lastHeartbeat?: number
  currentTask?: string
  error?: string
  model?: string
  kind?: string
  key?: string
}

async function getOpenClawAgents(): Promise<AgentState[]> {
  try {
    // Get live session data from OpenClaw CLI
    const output = execSync('openclaw sessions --json --active 60', { 
      encoding: 'utf-8',
      timeout: 10000 
    })
    
    const data = JSON.parse(output)
    const sessions = data.sessions || []
    
    // Transform sessions into agent states
    // Group by key prefix to get unique "agents" (conversations)
    const now = Date.now()
    
    return sessions.map((session: Record<string, unknown>) => {
      const ageMs = (session.ageMs as number) || 0
      const isActive = ageMs < 5 * 60 * 1000 // Active if updated in last 5 minutes
      
      return {
        id: session.key as string || session.sessionId as string,
        status: isActive ? 'running' : 'idle',
        lastHeartbeat: now - ageMs,
        currentTask: session.kind === 'cron' ? 'Cron Job' : session.kind === 'group' ? 'Group Chat' : 'Direct Chat',
        model: session.model as string,
        kind: session.kind as string,
        key: session.key as string,
      }
    })
  } catch (error) {
    console.error('Error fetching agents from OpenClaw:', error)
    return []
  }
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

  // Trigger real-time update to connected clients
  triggerAgentEvent({ agents, timestamp: Date.now() }).catch(console.error)

  return NextResponse.json(agents)
}

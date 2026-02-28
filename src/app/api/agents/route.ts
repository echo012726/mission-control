import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

interface AgentState {
  id: string
  status: string
  lastHeartbeat?: number
  currentTask?: string
  error?: string
}

async function getOpenClawAgents(): Promise<AgentState[]> {
  const agents: AgentState[] = []
  
  // Try to read from OpenClaw state file if it exists
  const statePath = '/root/.openclaw/state/agents.json'
  
  try {
    if (fs.existsSync(statePath)) {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'))
      return data.agents || []
    }
  } catch (e) {
    // State file doesn't exist or is invalid
  }

  // Try alternative paths
  const altPaths = [
    '/root/.openclaw/workspace-main/.openclaw/state.json',
    '/root/.openclaw/gateway-state.json',
  ]

  for (const altPath of altPaths) {
    try {
      if (fs.existsSync(altPath)) {
        const data = JSON.parse(fs.readFileSync(altPath, 'utf-8'))
        if (data.agents) return data.agents
        if (data.sessions) {
          // Convert sessions to agents format
          return Object.entries(data.sessions).map(([id, session]: [string, any]) => ({
            id,
            status: session.status || 'unknown',
            lastHeartbeat: session.lastHeartbeat,
            currentTask: session.currentTask,
            error: session.error,
          }))
        }
      }
    } catch (e) {
      // Continue trying
    }
  }

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

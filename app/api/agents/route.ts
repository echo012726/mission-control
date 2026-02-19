import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const sessionsFile = '/root/.openclaw/agents/main/sessions/sessions.json'
  
  try {
    const content = fs.readFileSync(sessionsFile, 'utf-8')
    const sessions = JSON.parse(content)
    
    // Get list of all agents from the directory
    const agentsDir = '/root/.openclaw/workspace'
    const agentDirs = fs.readdirSync(agentsDir).filter(d => 
      fs.existsSync(path.join(agentsDir, d, 'SKILL.md'))
    )
    
    // Transform session data into agent status
    const agents = Object.entries(sessions).map(([key, data]: [string, any]) => {
      const [, agentId] = key.split(':')
      return {
        id: agentId,
        name: agentId.charAt(0).toUpperCase() + agentId.slice(1).replace(/-/g, ' '),
        sessionId: data.sessionId,
        status: determineStatus(data.updatedAt),
        lastActive: data.updatedAt,
        chatType: data.chatType,
        origin: data.origin?.label || 'unknown'
      }
    })
    
    // Add known agents from AGENTS.md
    const knownAgents = [
      { id: 'main', name: 'Echo', role: 'Main Orchestrator' },
      { id: 'coder', name: 'Coder', role: 'Development' },
      { id: 'researcher', name: 'Researcher', role: 'Research' },
      { id: 'executor', name: 'Executor', role: 'Automation' },
      { id: 'polybot', name: 'PolyBot', role: 'Trading' },
      { id: 'trading-strategist', name: 'Trading Strategist', role: 'Trading' },
      { id: 'reviewer', name: 'Reviewer', role: 'Code Review' },
      { id: 'debugger', name: 'Debugger', role: 'Debugging' },
    ]
    
    // Merge with known agents
    const mergedAgents = knownAgents.map(known => {
      const sessionData = agents.find((a: any) => a.id === known.id)
      return {
        ...known,
        status: sessionData?.status || 'offline',
        lastActive: sessionData?.lastActive || null,
        currentTask: sessionData?.origin || 'Idle'
      }
    })
    
    return NextResponse.json(mergedAgents)
  } catch (error) {
    console.error('Error reading agent status:', error)
    return NextResponse.json({ error: 'Failed to load agent status' }, { status: 500 })
  }
}

function determineStatus(updatedAt: number): string {
  const now = Date.now()
  const diff = now - updatedAt
  
  // Within last 2 minutes = online/busy
  if (diff < 120000) return 'busy'
  // Within 10 minutes = away
  if (diff < 600000) return 'away'
  return 'offline'
}

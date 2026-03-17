import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const TRACKER_FILE = '/root/.openclaw/workspace/tracking/family-tracker.json'

interface Person {
  id: string
  name: string
  relationship: string
  lastSeen: string | null
  targetFrequencyDays: number
  notes: string
}

interface LogEntry {
  id: string
  personId: string
  timestamp: string
  method: string // 'call', 'text', 'in-person', 'video', 'other'
  notes?: string
}

interface FamilyTrackerData {
  description: string
  people: Person[]
  log: LogEntry[]
}

function readTrackerData(): FamilyTrackerData {
  try {
    const data = fs.readFileSync(TRACKER_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading tracker data:', error)
    return { description: '', people: [], log: [] }
  }
}

function writeTrackerData(data: FamilyTrackerData): void {
  try {
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing tracker data:', error)
  }
}

export async function GET(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = readTrackerData()
  
  // Calculate days since last contact for each person
  const peopleWithStatus = data.people.map(person => {
    let daysSince = null
    let needsContact = false
    let status: 'good' | 'due' | 'overdue' = 'good'
    
    if (person.lastSeen) {
      const lastSeenDate = new Date(person.lastSeen)
      const now = new Date()
      daysSince = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24))
      needsContact = daysSince >= person.targetFrequencyDays
      status = daysSince >= person.targetFrequencyDays * 2 ? 'overdue' : needsContact ? 'due' : 'good'
    } else {
      needsContact = true
      status = 'overdue' // Never seen = overdue
    }
    
    return {
      ...person,
      daysSince,
      needsContact,
      status
    }
  })

  return NextResponse.json({
    people: peopleWithStatus,
    log: data.log
  })
}

export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { personId, method, notes } = body

  if (!personId || !method) {
    return NextResponse.json({ error: 'personId and method are required' }, { status: 400 })
  }

  const data = readTrackerData()
  const person = data.people.find(p => p.id === personId)
  
  if (!person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 })
  }

  // Update lastSeen for the person
  person.lastSeen = new Date().toISOString()

  // Add log entry
  const logEntry: LogEntry = {
    id: `log-${Date.now()}`,
    personId,
    timestamp: new Date().toISOString(),
    method,
    notes: notes || ''
  }
  data.log.unshift(logEntry)

  // Keep only last 100 log entries
  if (data.log.length > 100) {
    data.log = data.log.slice(0, 100)
  }

  writeTrackerData(data)

  return NextResponse.json({ success: true, logEntry })
}

// Add a new person to track
export async function PUT(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, relationship, targetFrequencyDays, notes } = body

  if (!name || !relationship) {
    return NextResponse.json({ error: 'name and relationship are required' }, { status: 400 })
  }

  const data = readTrackerData()
  
  const newPerson: Person = {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    relationship,
    lastSeen: null,
    targetFrequencyDays: targetFrequencyDays || 7,
    notes: notes || ''
  }

  data.people.push(newPerson)
  writeTrackerData(data)

  return NextResponse.json({ success: true, person: newPerson })
}

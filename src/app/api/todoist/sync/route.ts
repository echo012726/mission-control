import { NextRequest, NextResponse } from 'next/server'
import { syncTodoistTasks, getSyncStatus } from '@/lib/todoist'

// Simple token validation
function validateToken(request: NextRequest): boolean {
  const token = request.nextUrl.searchParams.get('token')
  const validToken = process.env.MISSION_CONTROL_TOKEN || 'mc_dev_token_2024'
  return token === validToken
}

export async function POST(request: NextRequest) {
  // Check authentication
  if (!validateToken(request)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { status: 401 })
  }

  try {
    const result = await syncTodoistTasks()
    
    return NextResponse.json({
      success: true,
      ...result,
      message: `Synced ${result.added} new tasks, updated ${result.updated} existing tasks, skipped ${result.skipped} tasks`
    })
  } catch (error) {
    console.error('Todoist sync error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Check authentication
  if (!validateToken(request)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { status: 401 })
  }

  try {
    const status = await getSyncStatus()
    
    return NextResponse.json({
      success: true,
      ...status
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

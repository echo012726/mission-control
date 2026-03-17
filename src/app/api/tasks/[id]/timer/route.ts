import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/tasks/[id]/timer - Start or stop timer
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { action } = await request.json() // 'start' or 'stop'

    const task = await prisma.task.findUnique({
      where: { id },
      select: { timerStarted: true, timeSpent: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (action === 'start') {
      // Start timer
      const timerStarted = new Date().toISOString()
      await prisma.task.update({
        where: { id },
        data: { timerStarted }
      })
      return NextResponse.json({ timerStarted, status: 'running' })
    } else if (action === 'stop') {
      // Stop timer and add time spent
      if (task.timerStarted) {
        const startTime = new Date(task.timerStarted)
        const now = new Date()
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        const newTimeSpent = (task.timeSpent || 0) + elapsedSeconds

        await prisma.task.update({
          where: { id },
          data: {
            timerStarted: null,
            timeSpent: newTimeSpent
          }
        })

        return NextResponse.json({ 
          timeSpent: newTimeSpent, 
          sessionTime: elapsedSeconds,
          status: 'stopped' 
        })
      }
      return NextResponse.json({ error: 'Timer not running' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Timer error:', error)
    return NextResponse.json({ error: 'Failed to control timer' }, { status: 500 })
  }
}

// GET /api/tasks/[id]/timer - Get timer status
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id },
      select: { timerStarted: true, timeSpent: true }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    let currentElapsed = 0
    let isRunning = false

    if (task.timerStarted) {
      isRunning = true
      const startTime = new Date(task.timerStarted)
      currentElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
    }

    return NextResponse.json({
      isRunning,
      timerStarted: task.timerStarted,
      timeSpent: task.timeSpent || 0,
      currentElapsed
    })
  } catch (error) {
    console.error('Timer error:', error)
    return NextResponse.json({ error: 'Failed to get timer status' }, { status: 500 })
  }
}

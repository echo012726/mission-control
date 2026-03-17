import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/import/asana - Import tasks from Asana JSON export
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, options = {} } = body
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid Asana export format. Expected data array.' },
        { status: 400 }
      )
    }

    const {
      skipCompleted = false,
      mapToLane = 'planned' // inbox, planned, inProgress, blocked, done
    } = options

    let imported = 0
    let skipped = 0
    let duplicates = 0
    const errors: string[] = []

    for (const task of data) {
      try {
        // Skip if no name/title
        if (!task.name) {
          errors.push(`Skipped task without name: ${task.gid}`)
          skipped++
          continue
        }

        // Skip completed tasks if option set
        if (skipCompleted && task.completed) {
          skipped++
          continue
        }

        // Check for duplicate by asanaId
        const existing = await prisma.task.findUnique({
          where: { asanaId: String(task.gid) }
        })

        if (existing) {
          duplicates++
          continue
        }

        // Determine status
        let status = mapToLane
        if (task.memberships && task.memberships.length > 0) {
          const sectionName = task.memberships[0]?.section?.name?.toLowerCase() || ''
          if (sectionName.includes('done') || sectionName.includes('complete')) {
            status = 'done'
          } else if (sectionName.includes('progress')) {
            status = 'inProgress'
          } else if (sectionName.includes('block')) {
            status = 'blocked'
          } else if (sectionName.includes('backlog') || sectionName.includes('planned')) {
            status = 'planned'
          } else if (sectionName.includes('inbox')) {
            status = 'inbox'
          }
        }

        // Map priority (Asana: 1-4, our scale: low, medium, high)
        let priority = 'medium'
        if (task.assignee) {
          priority = 'high' // Assigned tasks get higher priority
        }

        // Extract tags
        const tags: string[] = []
        if (task.tags && Array.isArray(task.tags)) {
          task.tags.forEach((tag: { name: string }) => {
            if (tag.name) tags.push(tag.name)
          })
        }

        await prisma.task.create({
          data: {
            title: task.name,
            description: task.notes || '',
            status: task.completed ? 'done' : status,
            priority,
            tags: JSON.stringify(tags),
            dueDate: task.due_on ? new Date(task.due_on) : null,
            asanaId: String(task.gid),
            asanaProjectId: task.memberships?.[0]?.project?.gid 
              ? String(task.memberships[0].project.gid) 
              : null,
          }
        })

        imported++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Error importing task ${task.gid}: ${errorMsg}`)
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: 'import',
        payload: JSON.stringify({ source: 'asana', imported, skipped, duplicates }),
      }
    })

    return NextResponse.json({
      success: true,
      summary: {
        imported,
        skipped,
        duplicates,
        errors: errors.length > 0 ? errors : undefined,
      }
    })
  } catch (error) {
    console.error('Asana import error:', error)
    return NextResponse.json(
      { error: 'Failed to import Asana tasks' },
      { status: 500 }
    )
  }
}

// GET /api/import/asana - Get import instructions
export async function GET() {
  return NextResponse.json({
    instructions: 'POST JSON with { data: [...tasks], options?: { skipCompleted, mapToLane } }',
    expectedFormat: {
      data: 'Array of Asana task objects from data export',
      options: {
        skipCompleted: 'Boolean - skip completed tasks (default: false)',
        mapToLane: 'Default lane for tasks without section mapping (default: planned)'
      }
    },
    fieldMapping: {
      name: 'title',
      notes: 'description',
      due_on: 'dueDate',
      completed: 'status (done if true)',
      memberships: 'status mapping based on section name',
      tags: 'tags array'
    }
  })
}

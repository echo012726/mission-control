import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskIds, action, value } = body

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'No tasks selected' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'No action specified' }, { status: 400 })
    }

    let updatedTasks: any[] = []
    let deletedCount = 0

    switch (action) {
      case 'move':
        // Move tasks to a new status
        if (!value) {
          return NextResponse.json({ error: 'No status value provided' }, { status: 400 })
        }
        updatedTasks = await Promise.all(
          taskIds.map(id =>
            prisma.task.update({
              where: { id },
              data: { status: value },
            })
          )
        )
        await logActivity('tasks_bulk_move', { taskIds, newStatus: value })
        break

      case 'priority':
        // Set priority for tasks
        if (!value) {
          return NextResponse.json({ error: 'No priority value provided' }, { status: 400 })
        }
        updatedTasks = await Promise.all(
          taskIds.map(id =>
            prisma.task.update({
              where: { id },
              data: { priority: value },
            })
          )
        )
        await logActivity('tasks_bulk_priority', { taskIds, priority: value })
        break

      case 'delete':
        // Delete tasks
        const deleteResult = await prisma.task.deleteMany({
          where: {
            id: { in: taskIds },
          },
        })
        deletedCount = deleteResult.count
        await logActivity('tasks_bulk_delete', { taskIds, count: deletedCount })
        break

      case 'tags':
        // Add tags to tasks
        if (!value || !Array.isArray(value)) {
          return NextResponse.json({ error: 'No tags value provided' }, { status: 400 })
        }
        // Get current tags and merge
        const tasksWithTags = await prisma.task.findMany({
          where: { id: { in: taskIds } },
          select: { id: true, tags: true },
        })

        for (const task of tasksWithTags) {
          const currentTags = JSON.parse(task.tags || '[]')
          const newTags = [...new Set([...currentTags, ...value])]
          await prisma.task.update({
            where: { id: task.id },
            data: { tags: JSON.stringify(newTags) },
          })
        }
        updatedTasks = await prisma.task.findMany({
          where: { id: { in: taskIds } },
        })
        await logActivity('tasks_bulk_tags', { taskIds, tags: value })
        break

      case 'dueDate':
        // Set due date for tasks
        // value can be a date string or null to clear
        updatedTasks = await Promise.all(
          taskIds.map(id =>
            prisma.task.update({
              where: { id },
              data: { dueDate: value },
            })
          )
        )
        await logActivity('tasks_bulk_dueDate', { taskIds, dueDate: value })
        break

      case 'labels':
        // Set/replace labels for tasks
        if (!value || !Array.isArray(value)) {
          return NextResponse.json({ error: 'No labels value provided' }, { status: 400 })
        }
        updatedTasks = await Promise.all(
          taskIds.map(id =>
            prisma.task.update({
              where: { id },
              data: { labels: JSON.stringify(value) },
            })
          )
        )
        await logActivity('tasks_bulk_labels', { taskIds, labels: value })
        break

      case 'recurrence':
        // Set recurrence for tasks
        updatedTasks = await Promise.all(
          taskIds.map(id =>
            prisma.task.update({
              where: { id },
              data: { recurrence: value || null },
            })
          )
        )
        await logActivity('tasks_bulk_recurrence', { taskIds, recurrence: value })
        break

      case 'clearDueDate':
        // Clear due date
        updatedTasks = await Promise.all(
          taskIds.map(id =>
            prisma.task.update({
              where: { id },
              data: { dueDate: null },
            })
          )
        )
        await logActivity('tasks_bulk_clear_dueDate', { taskIds })
        break

      case 'clearRecurrence':
        // Clear recurrence
        updatedTasks = await Promise.all(
          taskIds.map(id =>
            prisma.task.update({
              where: { id },
              data: { recurrence: null },
            })
          )
        )
        await logActivity('tasks_bulk_clear_recurrence', { taskIds })
        break

      case 'estimatedTime':
        // Set estimated time (in minutes)
        if (value === undefined || value === null) {
          return NextResponse.json({ error: 'No estimatedTime value provided' }, { status: 400 })
        }
        updatedTasks = await Promise.all(
          taskIds.map(id =>
            prisma.task.update({
              where: { id },
              data: { estimatedTime: parseInt(value) },
            })
          )
        )
        await logActivity('tasks_bulk_estimatedTime', { taskIds, estimatedTime: value })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      action,
      updated: updatedTasks.length,
      deleted: deletedCount,
      tasks: updatedTasks,
    })
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 })
  }
}

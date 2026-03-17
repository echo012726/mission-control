import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/tasks/reminders - Get all tasks with reminders due
export async function GET(request: NextRequest) {
  try {
    const authenticated = await getSession();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pending = searchParams.get('pending') === 'true';
    const now = new Date();

    const where = pending 
      ? { reminder: { lte: now }, reminderSent: false, status: { not: 'done' } }
      : {};

    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        reminder: true,
        reminderSent: true,
        status: true,
        priority: true,
      },
      orderBy: { reminder: 'asc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

// POST /api/tasks/reminders - Set a reminder on a task
export async function POST(request: NextRequest) {
  try {
    const authenticated = await getSession();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, reminder, snoozeMinutes } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    // If snoozing, add minutes to current time
    let reminderTime = reminder ? new Date(reminder) : null;
    if (snoozeMinutes) {
      reminderTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        reminder: reminderTime,
        reminderSent: false, // Reset when reminder is updated
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: 'task_reminder_set',
        payload: JSON.stringify({ taskId, reminder: reminderTime }),
      },
    });

    return NextResponse.json({ 
      task: {
        id: task.id,
        title: task.title,
        reminder: task.reminder,
        reminderSent: task.reminderSent,
      }
    });
  } catch (error) {
    console.error('Error setting reminder:', error);
    return NextResponse.json({ error: 'Failed to set reminder' }, { status: 500 });
  }
}

// DELETE /api/tasks/reminders - Clear a reminder
export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await getSession();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        reminder: null,
        reminderSent: false,
      },
    });

    return NextResponse.json({ success: true, taskId: task.id });
  } catch (error) {
    console.error('Error clearing reminder:', error);
    return NextResponse.json({ error: 'Failed to clear reminder' }, { status: 500 });
  }
}

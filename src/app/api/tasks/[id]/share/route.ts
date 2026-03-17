import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/tasks/[id]/share - Share task to a team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if already shared
    const existing = await prisma.sharedTask.findFirst({
      where: { taskId, teamId }
    });
    if (existing) {
      return NextResponse.json({ error: 'Task already shared with this team' }, { status: 400 });
    }

    const sharedTask = await prisma.sharedTask.create({
      data: { taskId, teamId }
    });

    return NextResponse.json(sharedTask, { status: 201 });
  } catch (error) {
    console.error('Error sharing task:', error);
    return NextResponse.json({ error: 'Failed to share task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]/share - Unshare task from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    await prisma.sharedTask.deleteMany({
      where: { taskId, teamId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsharing task:', error);
    return NextResponse.json({ error: 'Failed to unshare task' }, { status: 500 });
  }
}

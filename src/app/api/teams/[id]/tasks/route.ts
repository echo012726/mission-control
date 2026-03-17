import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/teams/[id]/tasks - Get shared tasks for a team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');

    // Build where clause for filtering
    const whereClause: Record<string, unknown> = { teamId: id };
    
    // Get shared tasks with their associated tasks
    const sharedTasks = await prisma.sharedTask.findMany({
      where: whereClause,
      include: {
        team: true
      },
      orderBy: { sharedAt: 'desc' }
    });

    // Fetch the actual tasks
    const taskIds = sharedTasks.map(st => st.taskId);
    const tasks = await prisma.task.findMany({
      where: { 
        id: { in: taskIds },
        ...(status && { status }),
        ...(assigneeId && { assigneeId })
      },
      include: {
        subtasks: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' }, take: 5 }
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching team tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch team tasks' }, { status: 500 });
  }
}

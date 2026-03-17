import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logs = await prisma.workflowExecutionLog.findMany({
      where: { workflowId: id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      ...log,
      errors: log.errors ? JSON.parse(log.errors) : null,
      executionData: log.executionData ? JSON.parse(log.executionData) : null
    }));
    
    return NextResponse.json(parsedLogs);
  } catch (error) {
    console.error('Error fetching workflow logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

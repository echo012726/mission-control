import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { buildWeeklyReport } from '@/lib/weekly-report';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // Skip auth check in development
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDev) {
    const authenticated = await getSession();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const allTasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(buildWeeklyReport(allTasks, offset));
}

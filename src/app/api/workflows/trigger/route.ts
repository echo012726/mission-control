import { NextRequest, NextResponse } from 'next/server';
import { handleTaskEvent } from '@/lib/workflow-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, taskId, oldValue, newValue } = body;

    if (!type || !taskId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, taskId' },
        { status: 400 }
      );
    }

    const results = await handleTaskEvent({
      type,
      taskId,
      oldValue,
      newValue
    });

    return NextResponse.json({
      success: true,
      triggered: results.filter((r: { executed: boolean }) => r.executed).length,
      results
    });
  } catch (error) {
    console.error('Error triggering workflows:', error);
    return NextResponse.json(
      { error: 'Failed to trigger workflows' },
      { status: 500 }
    );
  }
}

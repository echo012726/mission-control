import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const workflow = await prisma.workflow.findUnique({
      where: { id }
    });
    
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }
    
    const updated = await prisma.workflow.update({
      where: { id },
      data: { isActive: !workflow.isActive }
    });
    
    return NextResponse.json({
      success: true,
      isActive: updated.isActive,
      message: updated.isActive ? 'Workflow enabled' : 'Workflow disabled'
    });
  } catch (error) {
    console.error('Error toggling workflow:', error);
    return NextResponse.json({ error: 'Failed to toggle workflow' }, { status: 500 });
  }
}

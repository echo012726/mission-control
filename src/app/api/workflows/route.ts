import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, nodes, edges } = body;
    
    const workflow = await prisma.workflow.create({
      data: {
        name: name || 'Untitled Workflow',
        description: description || '',
        nodes: JSON.stringify(nodes || []),
        edges: JSON.stringify(edges || []),
        isActive: true
      }
    });
    
    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}

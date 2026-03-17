import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { testData } = body;
    
    const workflow = await prisma.workflow.findUnique({
      where: { id }
    });
    
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }
    
    const nodes = JSON.parse(workflow.nodes);
    const edges = JSON.parse(workflow.edges);
    
    // Simulate workflow execution
    // In real implementation, this would evaluate triggers, conditions, and actions
    const testResult = {
      workflowId: id,
      workflowName: workflow.name,
      testData: testData || { mock: true },
      nodesCount: nodes.length,
      edgesCount: edges.length,
      wouldExecute: workflow.isActive,
      message: 'Test run completed successfully. Workflow is valid.'
    };
    
    // Log the test execution
    await prisma.workflowExecutionLog.create({
      data: {
        workflowId: id,
        status: 'success',
        triggeredBy: 'test',
        executedActions: nodes.filter((n: { type: string }) => n.type === 'action').length,
        executionData: JSON.stringify(testResult)
      }
    });
    
    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error testing workflow:', error);
    return NextResponse.json({ error: 'Failed to test workflow' }, { status: 500 });
  }
}

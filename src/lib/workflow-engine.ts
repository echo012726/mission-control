import { prisma } from '@/lib/prisma';

export interface TaskEvent {
  type: 'task_created' | 'task_status_changed' | 'task_tag_added';
  taskId: string;
  oldValue?: string;
  newValue?: string;
}

export async function executeWorkflow(workflowId: string, event: TaskEvent) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  });

  if (!workflow || !workflow.isActive) {
    return { executed: false, reason: 'Workflow not found or inactive' };
  }

  const nodes = JSON.parse(workflow.nodes as string);
  const executedActions: string[] = [];
  const errors: string[] = [];

  // Find trigger node
  const triggerNode = nodes.find((n: { type: string }) => n.type === 'trigger');
  if (!triggerNode) {
    return { executed: false, reason: 'No trigger configured' };
  }

  // Check if trigger matches event
  const triggerConfig = triggerNode.data?.config || {};
  if (!matchesTrigger(triggerConfig, event)) {
    return { executed: false, reason: 'Trigger does not match event' };
  }

  // Find and execute action nodes
  const actionNodes = nodes.filter((n: { type: string }) => n.type === 'action');
  
  for (const actionNode of actionNodes) {
    try {
      await executeAction(actionNode, event);
      executedActions.push(actionNode.id);
    } catch (error) {
      errors.push(`Action ${actionNode.id}: ${error}`);
    }
  }

  // Log execution
  await prisma.workflowExecutionLog.create({
    data: {
      workflowId,
      status: errors.length === 0 ? 'success' : errors.length < actionNodes.length ? 'partial' : 'failed',
      triggeredBy: event.type,
      executedActions: executedActions.length,
      errors: errors.length > 0 ? JSON.stringify(errors) : undefined,
      executionData: JSON.stringify({ event, executedActions })
    }
  });

  return { executed: true, executedActions, errors };
}

function matchesTrigger(config: Record<string, unknown>, event: TaskEvent): boolean {
  const eventType = config.eventType as string;
  
  switch (event.type) {
    case 'task_created':
      return eventType === 'task_created';
    case 'task_status_changed':
      return eventType === 'task_status_changed';
    case 'task_tag_added':
      return eventType === 'task_tag_added' || eventType === 'task_created'; // Also run on task created for tags
    default:
      return false;
  }
}

async function executeAction(actionNode: { data: { config: Record<string, unknown>; nodeType: string } }, event: TaskEvent) {
  const actionType = actionNode.data?.nodeType;
  const config = actionNode.data?.config || {};

  switch (actionType) {
    case 'update_task':
      if (config.status || config.priority) {
        const updateData: Record<string, string> = {};
        if (config.status) updateData.status = config.status as string;
        if (config.priority) updateData.priority = config.priority as string;
        await prisma.task.update({
          where: { id: event.taskId },
          data: updateData
        });
      }
      break;

    case 'add_tag':
      if (config.tag) {
        const task = await prisma.task.findUnique({ where: { id: event.taskId } });
        if (task) {
          const tags = JSON.parse(task.tags || '[]');
          if (!tags.includes(config.tag)) {
            tags.push(config.tag);
            await prisma.task.update({
              where: { id: event.taskId },
              data: { tags: JSON.stringify(tags) }
            });
          }
        }
      }
      break;

    case 'notify':
      // Notification logic would go here (email, Slack, Discord)
      console.log('Notification would be sent for task:', event.taskId);
      break;

    case 'assign_agent':
      if (config.agentId) {
        await prisma.task.update({
          where: { id: event.taskId },
          data: { agentId: config.agentId as string }
        });
      }
      break;

    case 'archive':
      // Mark task as deleted (archived)
      await prisma.task.update({
        where: { id: event.taskId },
        data: { deletedAt: new Date() }
      });
      break;

    default:
      console.log('Unknown action type:', actionType);
  }
}

// API route handler for task events
export async function handleTaskEvent(event: TaskEvent) {
  const workflows = await prisma.workflow.findMany({
    where: { isActive: true }
  });

  const results = [];
  for (const workflow of workflows) {
    const result = await executeWorkflow(workflow.id, event);
    results.push({ workflowId: workflow.id, ...result });
  }

  return results;
}

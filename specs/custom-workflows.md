# Mission Control - Custom Workflows

## Overview
**Feature:** Custom Workflows  
**App:** Mission Control  
**Priority:** High  
**Date:** March 12, 2026

## Problem
Users need to automate repetitive task actions and create custom automation sequences without writing code.

## Solution
A visual workflow builder that lets users create custom automation rules with triggers, conditions, and actions.

## UI/UX

### Workflow Builder Page (`/workflows`)
- **Left Panel:** Trigger & Action library (collapsible sections)
- **Center:** Visual canvas for building workflow (node-based editor)
- **Right Panel:** Selected node configuration
- **Top Bar:** Save, Test, Delete buttons + workflow name input

### Trigger Types
| Trigger | Description |
|---------|-------------|
| Task Created | When a new task is added |
| Task Status Changed | When task moves between lanes |
| Task Tag Added | When specific tag is applied |
| Scheduled | Cron-based (daily, weekly, custom) |
| Agent Status Change | When agent goes idle/error |

### Action Types
| Action | Description |
|--------|-------------|
| Update Task | Change status, priority, tags |
| Add Tag | Apply tags to task |
| Remove Tag | Remove tags from task |
| Send Notification | Email/Slack/Discord alert |
| Create Task | Spawn new task |
| Assign Agent | Tag an agent to task |
| Archive Task | Move to archive |

### Condition Logic
- If task priority = "high" → ...
- If task has tag "urgent" → ...
- If agent status = "error" → ...

### Visual Design
- Dark mode compatible (app-wide)
- Node-based flow with connecting lines
- Drag-and-drop from library to canvas
- Color-coded nodes (triggers=yellow, actions=blue, conditions=purple)

## Functionality

### Workflow Management
- Create, edit, delete workflows
- Toggle workflow on/off
- View execution history/logs
- Duplicate existing workflows

### Real-time Execution
- WebSocket events for instant trigger detection
- Queue system for async actions
- Retry logic for failed actions (3 attempts)

### Testing Mode
- "Test Run" button to simulate trigger
- Preview what actions would execute
- Debug mode with execution log

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workflows` | List all workflows |
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows/[id]` | Get workflow details |
| PATCH | `/api/workflows/[id]` | Update workflow |
| DELETE | `/api/workflows/[id]` | Delete workflow |
| POST | `/api/workflows/[id]/test` | Test run workflow |
| GET | `/api/workflows/[id]/logs` | Get execution logs |
| POST | `/api/workflows/[id]/toggle` | Enable/disable |

## Data Model

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  nodes: WorkflowNode[];
  edges: Connection[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  position: { x: number; y: number };
  data: TriggerData | ConditionData | ActionData;
}

interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  status: 'success' | 'failed' | 'partial';
  triggeredBy: string;
  executedActions: number;
  errors?: string[];
  createdAt: Date;
}
```

## Acceptance Criteria

1. ✅ User can create a new workflow with name/description
2. ✅ User can add triggers from library to canvas
3. ✅ User can add conditions to filter triggers
4. ✅ User can add actions that execute when conditions match
5. ✅ User can connect nodes visually (drag lines)
6. ✅ User can save and toggle workflow on/off
7. ✅ Workflows execute in real-time when triggers fire
8. ✅ User can view execution history/logs
9. ✅ Test mode shows preview of actions
10. ✅ Dark mode styling throughout

## Out of Scope (v1)
- Complex nested conditions (AND/OR groups)
- Webhook triggers (external)
- AI-generated workflows
- Multi-step branching (single linear flow only)

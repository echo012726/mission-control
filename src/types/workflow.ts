export interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  nodes: string | WorkflowNode[];
  edges: string | WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  position: {
    x: number;
    y: number;
  };
  data: {
    label?: string;
    config?: Record<string, unknown>;
    nodeType?: string;
    [key: string]: unknown;
  };
}

export interface WorkflowEdge {
  id?: string;
  source: string;
  target: string;
}

export interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  status: 'success' | 'failed' | 'partial';
  triggeredBy?: string;
  executedActions: number;
  errors?: string[];
  executionData?: Record<string, unknown>;
  createdAt: string;
}

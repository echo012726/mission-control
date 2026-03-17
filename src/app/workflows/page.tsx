'use client';

import { useState, useEffect, useCallback } from 'react';
import { Workflow, WorkflowNode, WorkflowEdge } from '@/types/workflow';

interface TriggerTemplate {
  type: string;
  label: string;
  icon: string;
  description: string;
}

interface ActionTemplate {
  type: string;
  label: string;
  icon: string;
  description: string;
}

const TRIGGERS: TriggerTemplate[] = [
  { type: 'task_created', label: 'Task Created', icon: '➕', description: 'When a new task is added' },
  { type: 'task_status_changed', label: 'Status Changed', icon: '🔄', description: 'When task moves between lanes' },
  { type: 'task_tag_added', label: 'Tag Added', icon: '🏷️', description: 'When specific tag is applied' },
  { type: 'scheduled', label: 'Scheduled', icon: '⏰', description: 'Cron-based trigger' },
  { type: 'agent_status', label: 'Agent Status', icon: '🤖', description: 'When agent goes idle/error' },
];

const ACTIONS: ActionTemplate[] = [
  { type: 'update_task', label: 'Update Task', icon: '✏️', description: 'Change status, priority, tags' },
  { type: 'add_tag', label: 'Add Tag', icon: '➕🏷️', description: 'Apply tags to task' },
  { type: 'remove_tag', label: 'Remove Tag', icon: '➖🏷️', description: 'Remove tags from task' },
  { type: 'notify', label: 'Send Notification', icon: '📧', description: 'Email/Slack/Discord alert' },
  { type: 'create_task', label: 'Create Task', icon: '📝', description: 'Spawn new task' },
  { type: 'assign_agent', label: 'Assign Agent', icon: '👤', description: 'Tag an agent to task' },
  { type: 'archive', label: 'Archive Task', icon: '📦', description: 'Move to archive' },
];

const CONDITIONS = [
  { type: 'priority_is', label: 'Priority Is', icon: '⚡', description: 'If task priority equals' },
  { type: 'has_tag', label: 'Has Tag', icon: '🏷️', description: 'If task has tag' },
  { type: 'status_is', label: 'Status Is', icon: '📋', description: 'If status equals' },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [showNodePanel, setShowNodePanel] = useState(true);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [logs, setLogs] = useState<Array<{ id: string; status: string; createdAt: string }>>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: string; template: TriggerTemplate | ActionTemplate } | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  };

  const createWorkflow = async () => {
    if (!newWorkflowName.trim()) return;
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkflowName })
      });
      const newWorkflow = await res.json();
      setWorkflows([newWorkflow, ...workflows]);
      setSelectedWorkflow(newWorkflow);
      setIsCreating(false);
      setNewWorkflowName('');
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const updateWorkflow = async (updates: Partial<Workflow>) => {
    if (!selectedWorkflow) return;
    try {
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setSelectedWorkflow(updated);
      setWorkflows(workflows.map(w => w.id === updated.id ? updated : w));
    } catch (error) {
      console.error('Failed to update workflow:', error);
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      setWorkflows(workflows.filter(w => w.id !== id));
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const toggleWorkflow = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}/toggle`, { method: 'POST' });
      const result = await res.json();
      setWorkflows(workflows.map(w => w.id === id ? { ...w, isActive: result.isActive } : w));
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow({ ...selectedWorkflow, isActive: result.isActive });
      }
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const testWorkflow = async () => {
    if (!selectedWorkflow) return;
    try {
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testData: { mock: true } })
      });
      const result = await res.json();
      alert(`Test Result: ${result.message}`);
    } catch (error) {
      console.error('Failed to test workflow:', error);
    }
  };

  const fetchLogs = async () => {
    if (!selectedWorkflow) return;
    try {
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}/logs`);
      const data = await res.json();
      setLogs(data);
      setShowLogs(true);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const addNode = (type: 'trigger' | 'condition' | 'action', template: TriggerTemplate | ActionTemplate) => {
    if (!selectedWorkflow) return;
    
    const nodesStr = typeof selectedWorkflow.nodes === 'string' ? selectedWorkflow.nodes : JSON.stringify(selectedWorkflow.nodes);
    const nodes = JSON.parse(nodesStr || '[]');
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 30 },
      data: { 
        label: template.label, 
        config: {},
        nodeType: template.type
      }
    };
    
    nodes.push(newNode);
    updateWorkflow({ nodes: JSON.stringify(nodes) });
  };

  const handleDragStart = (type: string, template: TriggerTemplate | ActionTemplate) => {
    setDraggedItem({ type, template });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem) {
      const nodeType = draggedItem.type === 'trigger' ? 'trigger' : 
                       draggedItem.type === 'condition' ? 'condition' : 'action';
      addNode(nodeType, draggedItem.template);
      setDraggedItem(null);
    }
  };

  const deleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return;
    const nodes = JSON.parse(typeof selectedWorkflow.nodes === 'string' ? selectedWorkflow.nodes : JSON.stringify(selectedWorkflow.nodes) || '[]').filter((n: WorkflowNode) => n.id !== nodeId);
    const edges = JSON.parse(typeof selectedWorkflow.edges === 'string' ? selectedWorkflow.edges : JSON.stringify(selectedWorkflow.edges) || '[]').filter((e: WorkflowEdge) => 
      e.source !== nodeId && e.target !== nodeId
    );
    updateWorkflow({ nodes: nodes as unknown as string, edges: edges as unknown as string });
    setSelectedNode(null);
  };

  const updateNodeConfig = (nodeId: string, config: Record<string, unknown>) => {
    if (!selectedWorkflow) return;
    const nodes = JSON.parse(typeof selectedWorkflow.nodes === 'string' ? selectedWorkflow.nodes : JSON.stringify(selectedWorkflow.nodes) || '[]').map((n: WorkflowNode) => 
      n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
    );
    updateWorkflow({ nodes: nodes as unknown as string });
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'bg-yellow-500/20 border-yellow-500';
      case 'condition': return 'bg-purple-500/20 border-purple-500';
      case 'action': return 'bg-blue-500/20 border-blue-500';
      default: return 'bg-gray-500/20 border-gray-500';
    }
  };

  const getNodeIcon = (nodeType: string | undefined) => {
    if (!nodeType) return '⚙️';
    const trigger = TRIGGERS.find(t => t.type === nodeType);
    if (trigger) return trigger.icon;
    const action = ACTIONS.find(a => a.type === nodeType);
    if (action) return action.icon;
    const condition = CONDITIONS.find(c => c.type === nodeType);
    if (condition) return condition.icon;
    return '⚙️';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Workflows</h1>
          <p className="text-gray-400 text-sm">Automate your task management</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium flex items-center gap-2"
        >
          <span>+</span> New Workflow
        </button>
      </div>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Sidebar - Workflow List */}
        <div className="w-72 border-r border-gray-800 overflow-y-auto p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">Workflows</h2>
          <div className="space-y-2">
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                onClick={() => setSelectedWorkflow(workflow)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedWorkflow?.id === workflow.id 
                    ? 'bg-indigo-600/20 border border-indigo-500' 
                    : 'bg-gray-900/50 hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{workflow.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWorkflow(workflow.id); }}
                    className={`text-xs px-2 py-1 rounded ${
                      workflow.isActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {workflow.isActive ? 'ON' : 'OFF'}
                  </button>
                </div>
                {workflow.description && (
                  <p className="text-xs text-gray-400 mt-1">{workflow.description}</p>
                )}
              </div>
            ))}
            {workflows.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No workflows yet</p>
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {selectedWorkflow ? (
            <>
              {/* Workflow Editor Toolbar */}
              <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={selectedWorkflow.name}
                    onChange={(e) => updateWorkflow({ name: e.target.value })}
                    className="bg-transparent border-none text-lg font-semibold focus:outline-none focus:ring-0"
                  />
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedWorkflow.isActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {selectedWorkflow.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={testWorkflow}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                  >
                    🧪 Test
                  </button>
                  <button
                    onClick={fetchLogs}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                  >
                    📋 Logs
                  </button>
                  <button
                    onClick={() => deleteWorkflow(selectedWorkflow.id)}
                    className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Canvas Area */}
              <div 
                className="flex-1 flex overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Node Library */}
                {showNodePanel && (
                  <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-400">Nodes</h3>
                      <button onClick={() => setShowNodePanel(false)} className="text-gray-500">✕</button>
                    </div>
                    
                    {/* Triggers */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                        <span>⚡</span> Triggers
                      </h4>
                      <div className="space-y-1">
                        {TRIGGERS.map(trigger => (
                          <div
                            key={trigger.type}
                            draggable
                            onDragStart={() => handleDragStart('trigger', trigger)}
                            className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded cursor-grab hover:bg-yellow-500/20 text-sm"
                          >
                            <span className="mr-1">{trigger.icon}</span>
                            {trigger.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                        <span>🔀</span> Conditions
                      </h4>
                      <div className="space-y-1">
                        {CONDITIONS.map(condition => (
                          <div
                            key={condition.type}
                            draggable
                            onDragStart={() => handleDragStart('condition', condition)}
                            className="p-2 bg-purple-500/10 border border-purple-500/30 rounded cursor-grab hover:bg-purple-500/20 text-sm"
                          >
                            <span className="mr-1">{condition.icon}</span>
                            {condition.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
                        <span>🎯</span> Actions
                      </h4>
                      <div className="space-y-1">
                        {ACTIONS.map(action => (
                          <div
                            key={action.type}
                            draggable
                            onDragStart={() => handleDragStart('action', action)}
                            className="p-2 bg-blue-500/10 border border-blue-500/30 rounded cursor-grab hover:bg-blue-500/20 text-sm"
                          >
                            <span className="mr-1">{action.icon}</span>
                            {action.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Canvas */}
                <div className="flex-1 bg-gray-900/50 relative overflow-auto p-6">
                  {!showNodePanel && (
                    <button
                      onClick={() => setShowNodePanel(true)}
                      className="absolute top-4 left-4 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm z-10"
                    >
                      📦 Nodes
                    </button>
                  )}

                  {(() => {
                    const nodes = JSON.parse(typeof selectedWorkflow.nodes === 'string' ? selectedWorkflow.nodes : JSON.stringify(selectedWorkflow.nodes) || '[]');
                    const edges = JSON.parse(typeof selectedWorkflow.edges === 'string' ? selectedWorkflow.edges : JSON.stringify(selectedWorkflow.edges) || '[]');
                    
                    if (nodes.length === 0) {
                      return (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <p className="text-4xl mb-4">🔄</p>
                            <p>Drag nodes from the panel to build your workflow</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="relative min-h-[400px]">
                        {nodes.map((node: WorkflowNode, index: number) => (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNode(node)}
                            className={`absolute p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                              getNodeColor(node.type)
                            } ${selectedNode?.id === node.id ? 'ring-2 ring-white' : ''}`}
                            style={{
                              left: node.position.x,
                              top: node.position.y,
                              minWidth: '180px'
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{getNodeIcon(node.data?.nodeType)}</span>
                              <span className="font-semibold text-sm">{node.data?.label}</span>
                            </div>
                            <p className="text-xs text-gray-400 capitalize">{node.type}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full text-xs flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {/* Simple connection lines (visual only for now) */}
                        {edges.map((edge: WorkflowEdge, index: number) => {
                          const sourceNode = nodes.find((n: WorkflowNode) => n.id === edge.source);
                          const targetNode = nodes.find((n: WorkflowNode) => n.id === edge.target);
                          if (!sourceNode || !targetNode) return null;
                          
                          return (
                            <svg
                              key={index}
                              className="absolute inset-0 pointer-events-none"
                              style={{ width: '100%', height: '100%' }}
                            >
                              <line
                                x1={sourceNode.position.x + 90}
                                y1={sourceNode.position.y + 40}
                                x2={targetNode.position.x + 90}
                                y2={targetNode.position.y}
                                stroke="#4b5563"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                              />
                            </svg>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Node Config Panel */}
                {selectedNode && (
                  <div className="w-72 border-l border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Configure</h3>
                      <button onClick={() => setSelectedNode(null)} className="text-gray-500">✕</button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400">Node Type</label>
                        <p className="text-sm capitalize">{selectedNode.type}</p>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-400">Label</label>
                        <input
                          type="text"
                          value={selectedNode.data?.label || ''}
                          onChange={(e) => {
                            const nodes = JSON.parse(typeof selectedWorkflow.nodes === 'string' ? selectedWorkflow.nodes : JSON.stringify(selectedWorkflow.nodes) || '[]').map((n: WorkflowNode) => 
                              n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n
                            );
                            updateWorkflow({ nodes: nodes as unknown as string });
                          }}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm mt-1"
                        />
                      </div>

                      {selectedNode.type === 'trigger' && (
                        <div>
                          <label className="text-xs text-gray-400">Trigger Event</label>
                          <select
                            value={selectedNode.data?.nodeType || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, { eventType: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm mt-1"
                          >
                            <option value="">Select event...</option>
                            {TRIGGERS.map(t => (
                              <option key={t.type} value={t.type}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedNode.type === 'action' && (
                        <div>
                          <label className="text-xs text-gray-400">Action Type</label>
                          <select
                            value={selectedNode.data?.nodeType || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, { actionType: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm mt-1"
                          >
                            <option value="">Select action...</option>
                            {ACTIONS.map(a => (
                              <option key={a.type} value={a.type}>{a.label}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedNode.type === 'condition' && (
                        <div>
                          <label className="text-xs text-gray-400">Condition</label>
                          <select
                            value={selectedNode.data?.nodeType || ''}
                            onChange={(e) => updateNodeConfig(selectedNode.id, { conditionType: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm mt-1"
                          >
                            <option value="">Select condition...</option>
                            {CONDITIONS.map(c => (
                              <option key={c.type} value={c.type}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        onClick={() => deleteNode(selectedNode.id)}
                        className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-sm mt-4"
                      >
                        Delete Node
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-6xl mb-4">⚙️</p>
                <p className="text-lg">Select a workflow to edit</p>
                <p className="text-sm mt-2">or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Workflow Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4">New Workflow</h2>
            <input
              type="text"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              placeholder="Workflow name..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createWorkflow}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Execution Logs</h2>
              <button onClick={() => setShowLogs(false)} className="text-gray-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No logs yet</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        log.status === 'success' ? 'bg-green-600/20 text-green-400' :
                        log.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                        'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

# Enhanced Agent Panel - Implementation Spec

## Task
"Enhanced agent panel - More detail on running agents, trigger tasks"

## Current State
- AgentStatusPanel shows basic agent list with status, current task, last heartbeat
- AgentDeepDivePanel has Overview/Logs/Config tabs but minimal content
- POST endpoint exists at `/api/openclaw/agents` to spawn subagents

## Enhancement Plan

### 1. Add Task Trigger UI to AgentDeepDivePanel
- Add "Trigger Task" button/tab in the deep dive panel
- Form to submit task description
- Select agent type (coder, researcher, etc.)
- Select runtime/model
- Show submission status and spawned agent info

### 2. Expand Agent Details (Overview Tab)
- Add runtime/model information
- Calculate and display uptime (if running)
- Show message count if available
- Add session created timestamp

### 3. Improve Session History
- Show recent activity/commands
- Display session metrics

## Files to Modify
- `/root/.openclaw/workspace/mission-control/src/components/AgentDeepDivePanel.tsx`

## Status
- [x] Analyzed current implementation
- [x] Spec created
- [x] Task triggering UI added
- [x] Runtime details added
- [x] Fixed broken API endpoint URL
- [ ] Tested

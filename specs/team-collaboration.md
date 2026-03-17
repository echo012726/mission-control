# Team Collaboration Feature Specification

## Overview
Enable team-based task management with shared workspaces, member roles, and task assignments.

## Data Models

### Team
- `id`: UUID
- `name`: string
- `description`: string?
- `createdAt`: datetime
- `updatedAt`: datetime

### TeamMember
- `id`: UUID
- `teamId`: FK
- `userId`: string (email/identifier)
- `name`: string
- `role`: string (owner, admin, member, guest)
- `avatarUrl`: string?
- `joinedAt`: datetime

### SharedTask
- `id`: UUID
- `taskId`: FK
- `teamId`: FK
- `sharedAt`: datetime

## API Endpoints

### Teams
- `GET /api/teams` - List user's teams
- `POST /api/teams` - Create team
- `PATCH /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

### Team Members
- `GET /api/teams/[id]/members` - List members
- `POST /api/teams/[id]/members` - Add member
- `PATCH /api/teams/[id]/members/[memberId]` - Update role
- `DELETE /api/teams/[id]/members/[memberId]` - Remove member

### Shared Tasks
- `GET /api/teams/[id]/tasks` - List shared tasks
- `POST /api/tasks/[id]/share` - Share task to team
- `DELETE /api/tasks/[id]/share` - Unshare task

## UI Components

1. **TeamsPage** (`/teams`) - Manage teams
2. **TeamPanel** - Sidebar component to switch teams
3. **TaskAssigneeSelector** - Assign tasks to team members
4. **TeamActivityFeed** - Recent team activity

## Features
- Create/manage teams
- Add/remove team members with roles
- Assign tasks to team members
- Filter tasks by assignee
- Team activity stream
- Real-time updates for shared tasks

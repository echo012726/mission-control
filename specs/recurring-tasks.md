# Feature Spec: Recurring Tasks

## Feature Name
Recurring Tasks

## Description
Allow users to create tasks that automatically repeat on a schedule (daily, weekly, monthly, yearly). When a recurring task is completed, the next instance is automatically generated.

## Problem Being Solved
Users currently have to manually recreate repetitive tasks (like weekly reviews, daily standups, monthly bills) - this should be automatic.

## Tech Approach
- Add `recurrence` field to Task model in Prisma
- Update RecurringTaskModal component (already exists in codebase)
- Create API endpoints for managing recurring task instances
- Add recurrence indicators in Kanban board and task views

## Acceptance Criteria
1. User can set recurrence pattern when creating/editing a task (daily, weekly, monthly, yearly, custom)
2. Completed recurring tasks generate the next instance automatically
3. Recurring tasks show visual indicator (🔄 icon) in task cards
4. User can edit future instances independently from the series
5. User can skip/ignore specific instances
6. User can stop/remove recurrence from a task

## Priority
High - core productivity feature

## Estimate
Medium complexity - needs Prisma schema update + API + UI integration

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  // Create tasks
  const tasks = [
    // Inbox: 3 tasks
    { 
      id: 'task-1', 
      title: 'Review PR #42', 
      description: 'Code review for authentication refactor', 
      status: 'inbox', 
      priority: 'high',
      tags: JSON.stringify(['review', 'auth'])
    },
    { 
      id: 'task-2', 
      title: 'Update documentation', 
      description: 'Add API docs for new endpoints', 
      status: 'inbox', 
      priority: 'medium',
      tags: JSON.stringify(['docs'])
    },
    { 
      id: 'task-3', 
      title: 'Fix login bug', 
      description: 'Users reporting intermittent login failures', 
      status: 'inbox', 
      priority: 'high',
      tags: JSON.stringify(['bug', 'urgent'])
    },
    // Planned: 2 tasks
    { 
      id: 'task-4', 
      title: 'Design new dashboard', 
      description: 'Mockup designs for the analytics dashboard', 
      status: 'planned', 
      priority: 'medium',
      tags: JSON.stringify(['design', 'ui'])
    },
    { 
      id: 'task-5', 
      title: 'Implement caching layer', 
      description: 'Add Redis caching for API responses', 
      status: 'planned', 
      priority: 'medium',
      tags: JSON.stringify(['backend', 'performance'])
    },
    // In Progress: 2 tasks
    { 
      id: 'task-6', 
      title: 'Refactor auth module', 
      description: 'Clean up authentication logic', 
      status: 'in_progress', 
      priority: 'medium',
      tags: JSON.stringify(['refactor', 'auth']),
      timeSpent: 1800
    },
    { 
      id: 'task-7', 
      title: 'Write unit tests', 
      description: 'Add test coverage for user service', 
      status: 'in_progress', 
      priority: 'low',
      tags: JSON.stringify(['testing']),
      timeSpent: 900
    },
    // Blocked: 1 task
    { 
      id: 'task-8', 
      title: 'Database migration stuck', 
      description: 'Migration failing on production', 
      status: 'blocked', 
      priority: 'high',
      tags: JSON.stringify(['bug', 'production'])
    },
    // Done: 2 tasks
    { 
      id: 'task-9', 
      title: 'Complete onboarding flow', 
      description: 'User registration completed', 
      status: 'done', 
      priority: 'medium',
      tags: JSON.stringify(['feature']),
      timeSpent: 3600
    },
    { 
      id: 'task-10', 
      title: 'Setup CI/CD pipeline', 
      description: 'GitHub Actions workflow configured', 
      status: 'done', 
      priority: 'high',
      tags: JSON.stringify(['devops']),
      timeSpent: 7200
    },
  ]

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: task,
      create: task
    })
    console.log(`Created task: ${task.title}`)
  }

  // Create activity logs
  const activities = [
    { type: 'task_created', payload: JSON.stringify({ taskId: 'task-1', title: 'Review PR #42' }) },
    { type: 'task_created', payload: JSON.stringify({ taskId: 'task-2', title: 'Update documentation' }) },
    { type: 'task_moved', payload: JSON.stringify({ taskId: 'task-6', from: 'inbox', to: 'in_progress' }) },
    { type: 'task_completed', payload: JSON.stringify({ taskId: 'task-9', title: 'Complete onboarding flow' }) },
    { type: 'agent_heartbeat', payload: JSON.stringify({ agentId: 'echo-main', status: 'running' }) },
  ]

  for (const activity of activities) {
    await prisma.activityLog.create({
      data: activity
    })
    console.log(`Created activity: ${activity.type}`)
  }

  console.log('Seeding complete!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

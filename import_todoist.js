const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function importTasks() {
  const data = JSON.parse(fs.readFileSync('/tmp/todoist_tasks.json', 'utf-8'))
  
  // Clear existing sample tasks first
  await prisma.task.deleteMany({})
  
  let added = 0
  
  for (const task of data) {
    // Map priority: 1=p1(low), 2=p2(medium), 3=p3(high), 4=p4(urgent)
    const priorityMap = { 1: 'low', 2: 'medium', 3: 'high', 4: 'high' }
    const status = 'planned' // All go to backlog/planned
    
    // Skip very old overdue items (from 2022-2023)
    if (task.due?.date && task.due.date < '2024-01-01') {
      console.log(`Skipping old: ${task.content}`)
      continue
    }
    
    await prisma.task.create({
      data: {
        id: `todoist-${task.id}`,
        title: task.content,
        description: task.description || '',
        status,
        priority: priorityMap[task.priority] || 'medium',
        labels: JSON.stringify(task.labels || []),
        dueDate: task.due?.date || null,
        todoistId: task.id,
        todoistProjectId: task.project_id,
        createdAt: new Date(task.added_at),
      }
    })
    added++
    console.log(`Added: ${task.content}`)
  }
  
  console.log(`\nTotal imported: ${added} tasks`)
}

importTasks()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

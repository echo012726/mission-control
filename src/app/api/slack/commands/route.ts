import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Slack slash command types
type CommandAction = 'task' | 'search' | 'help'

interface ParsedCommand {
  action: CommandAction
  subaction?: string
  args: string[]
  raw: string
}

// Parse the Slack command text
function parseCommand(text: string): ParsedCommand | null {
  const parts = text.trim().split(/\s+/)
  if (parts.length < 1) return null

  // Remove the leading /mc if present
  const cmdParts = parts[0].startsWith('/mc') ? parts.slice(1) : parts
  
  if (cmdParts.length === 0) return null

  const action = cmdParts[0] as CommandAction
  
  if (action === 'help') {
    return { action: 'help', args: [], raw: text }
  }

  if (action === 'task' && cmdParts.length > 1) {
    const subaction = cmdParts[1] as 'create' | 'list' | 'complete' | 'due' | 'search'
    const args = cmdParts.slice(2)
    return { action: 'task', subaction, args, raw: text }
  }

  if (action === 'search' && cmdParts.length > 1) {
    return { action: 'search', args: cmdParts.slice(1), raw: text }
  }

  // Default to search if single word
  if (cmdParts.length === 1) {
    return { action: 'search', args: cmdParts, raw: text }
  }

  return null
}

// Format task for Slack response
function formatTaskForSlack(task: any): string {
  const status = task.completed ? '✅' : '⬜'
  const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'
  const due = task.dueDate ? ` *Due:* ${new Date(task.dueDate).toLocaleDateString()}` : ''
  return `${status} ${priority} *${task.title}*${due} (ID: ${task.id.slice(0, 8)})`
}

// Get help text
function getHelpText(): string {
  return `*Mission Control Slash Commands*

• \`/mc task create <title> [due:date]\` - Create a new task
• \`/mc task list\` - List your open tasks  
• \`/mc task complete <id>\` - Mark a task complete
• \`/mc task due <id> <date>\` - Set task due date
• \`/mc search <query>\` - Search tasks
• \`/mc help\` - Show this help

*Examples:*
• \`/mc task create Review PR #42\`
• \`/mc task list\`
• \`/mc task complete abc12345\`
• \`/mc task due abc12345 tomorrow\`
• \`/mc search bug\``
}

// POST - Handle slash command
export async function POST(request: NextRequest) {
  try {
    // Parse form data from Slack
    const formData = await request.formData()
    const command = formData.get('command') as string
    const text = formData.get('text') as string || ''
    const userId = formData.get('user_id') as string
    const userName = formData.get('user_name') as string
    const responseUrl = formData.get('response_url') as string

    console.log('Slack command:', command, 'text:', text, 'user:', userName)

    // Parse the command
    const parsed = parseCommand(text)
    
    if (!parsed) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Invalid command. Type `/mc help` for available commands.'
      })
    }

    // Handle help
    if (parsed.action === 'help') {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: getHelpText()
      })
    }

    // Handle search
    if (parsed.action === 'search') {
      const query = parsed.args.join(' ')
      const tasks = await prisma.task.findMany({
        where: {
          title: { contains: query, mode: 'insensitive' }
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
      })

      if (tasks.length === 0) {
        return NextResponse.json({
          response_type: 'ephemeral',
          text: `No tasks found matching "${query}"`
        })
      }

      const taskList = tasks.map(formatTaskForSlack).join('\n')
      return NextResponse.json({
        response_type: 'ephemeral',
        text: `*Found ${tasks.length} tasks:*\n${taskList}`
      })
    }

    // Handle task commands
    if (parsed.action === 'task') {
      // Task list
      if (parsed.subaction === 'list') {
        const tasks = await prisma.task.findMany({
          where: { completed: false },
          take: 10,
          orderBy: { updatedAt: 'desc' }
        })

        if (tasks.length === 0) {
          return NextResponse.json({
            response_type: 'ephemeral',
            text: 'No open tasks found!'
          })
        }

        const taskList = tasks.map(formatTaskForSlack).join('\n')
        return NextResponse.json({
          response_type: 'ephemeral',
          text: `*Your open tasks:*\n${taskList}`
        })
      }

      // Task create
      if (parsed.subaction === 'create') {
        const title = parsed.args.join(' ')
        
        if (!title) {
          return NextResponse.json({
            response_type: 'ephemeral',
            text: 'Please provide a task title. Usage: `/mc task create <title>`'
          })
        }

        // Check for due date in title (e.g., "Buy milk tomorrow")
        let dueDate: Date | undefined
        let finalTitle = title
        
        // Simple date parsing
        const tomorrowMatch = title.match(/tomorrow/i)
        const todayMatch = title.match(/today/i)
        
        if (tomorrowMatch) {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(23, 59, 0, 0)
          dueDate = tomorrow
          finalTitle = title.replace(/tomorrow/i, '').trim()
        } else if (todayMatch) {
          const today = new Date()
          today.setHours(23, 59, 0, 0)
          dueDate = today
          finalTitle = title.replace(/today/i, '').trim()
        }

        const task = await prisma.task.create({
          data: {
            title: finalTitle,
            dueDate,
            status: 'pending',
            priority: 'medium'
          }
        })

        const dueText = dueDate ? ` Due: ${dueDate.toLocaleDateString()}` : ''
        return NextResponse.json({
          response_type: 'ephemeral',
          text: `✅ Task created: *${task.title}*${dueText} (ID: ${task.id.slice(0, 8)})`
        })
      }

      // Task complete
      if (parsed.subaction === 'complete') {
        const taskId = parsed.args[0]
        
        if (!taskId) {
          return NextResponse.json({
            response_type: 'ephemeral',
            text: 'Please provide a task ID. Usage: `/mc task complete <id>`'
          })
        }

        // Try to find by ID prefix
        const task = await prisma.task.findFirst({
          where: { id: { startsWith: taskId } }
        })

        if (!task) {
          return NextResponse.json({
            response_type: 'ephemeral',
            text: `Task not found: ${taskId}`
          })
        }

        await prisma.task.update({
          where: { id: task.id },
          data: { completed: true, completedAt: new Date() }
        })

        return NextResponse.json({
          response_type: 'ephemeral',
          text: `✅ Task completed: *${task.title}*`
        })
      }

      // Task due date
      if (parsed.subaction === 'due') {
        const taskId = parsed.args[0]
        const dateStr = parsed.args.slice(1).join(' ')

        if (!taskId || !dateStr) {
          return NextResponse.json({
            response_type: 'ephemeral',
            text: 'Usage: `/mc task due <id> <date>` (e.g., "tomorrow", "next Friday", "March 15")'
          })
        }

        // Find task
        const task = await prisma.task.findFirst({
          where: { id: { startsWith: taskId } }
        })

        if (!task) {
          return NextResponse.json({
            response_type: 'ephemeral',
            text: `Task not found: ${taskId}`
          })
        }

        // Parse date
        let dueDate: Date
        
        if (dateStr.toLowerCase() === 'tomorrow') {
          dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 1)
          dueDate.setHours(23, 59, 0, 0)
        } else if (dateStr.toLowerCase() === 'today') {
          dueDate = new Date()
          dueDate.setHours(23, 59, 0, 0)
        } else if (dateStr.toLowerCase() === 'next week') {
          dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 7)
        } else {
          // Try parsing as date
          const parsed = new Date(dateStr)
          if (isNaN(parsed.getTime())) {
            return NextResponse.json({
              response_type: 'ephemeral',
              text: `Invalid date: ${dateStr}. Try "tomorrow", "next Friday", or "March 15"`
            })
          }
          dueDate = parsed
        }

        await prisma.task.update({
          where: { id: task.id },
          data: { dueDate }
        })

        return NextResponse.json({
          response_type: 'ephemeral',
          text: `📅 Due date set for *${task.title}*: ${dueDate.toLocaleDateString()}`
        })
      }

      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Unknown task command. Use `/mc help` for available commands.'
      })
    }

    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Unknown command. Type `/mc help` for available commands.'
    })

  } catch (error) {
    console.error('Slack command error:', error)
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'An error occurred processing your command. Please try again.'
    }, { status: 500 })
  }
}

// GET - Command info
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/slack/commands',
    method: 'POST',
    description: 'Handle Slack slash commands for Mission Control',
    commands: [
      '/mc task create <title>',
      '/mc task list',
      '/mc task complete <id>',
      '/mc task due <id> <date>',
      '/mc search <query>',
      '/mc help'
    ]
  })
}
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type TaskEventType = 'completed' | 'assigned' | 'due_soon' | 'created' | 'updated'

interface SendSlackNotificationParams {
  taskId: string
  taskTitle: string
  eventType: TaskEventType
  assigneeName?: string
  dueDate?: Date
  appUrl?: string
}

export async function sendSlackNotification({
  taskId,
  taskTitle,
  eventType,
  assigneeName,
  dueDate,
  appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3456'
}: SendSlackNotificationParams): Promise<boolean> {
  try {
    const account = await prisma.slackAccount.findFirst({
      where: { 
        userId: 'default',
        notifications: true
      }
    })

    if (!account || !account.webhookUrl) {
      console.log('Slack not connected or no webhook configured')
      return false
    }

    // Build message based on event type
    const eventMessages: Record<TaskEventType, { emoji: string; title: string; text: string }> = {
      completed: {
        emoji: '✅',
        title: 'Task Completed',
        text: `*${taskTitle}* has been marked as completed`
      },
      assigned: {
        emoji: '👤',
        title: 'Task Assigned',
        text: `*${taskTitle}* has been assigned to ${assigneeName || 'you'}`
      },
      due_soon: {
        emoji: '⏰',
        title: 'Due Soon',
        text: `*${taskTitle}* is due ${dueDate ? formatDueDate(dueDate) : 'soon'}`
      },
      created: {
        emoji: '✨',
        title: 'Task Created',
        text: `New task: *${taskTitle}*`
      },
      updated: {
        emoji: '📝',
        title: 'Task Updated',
        text: `*${taskTitle}* has been updated`
      }
    }

    const event = eventMessages[eventType]

    const slackMessage = {
      text: `${event.emoji} ${event.title}: ${taskTitle}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${event.emoji} ${event.title}`,
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: event.text
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${appUrl}/board?task=${taskId}|View in Mission Control →>`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 ${new Date().toLocaleString()}`
            }
          ]
        }
      ]
    }

    const response = await fetch(account.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    })

    if (!response.ok) {
      console.error('Failed to send Slack notification:', await response.text())
      return false
    }

    console.log(`Slack notification sent for task ${taskId} (${eventType})`)
    return true

  } catch (error) {
    console.error('Error sending Slack notification:', error)
    return false
  }
}

function formatDueDate(date: Date): string {
  const now = new Date()
  const due = new Date(date)
  const diffMs = due.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) {
    return 'in less than an hour'
  } else if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
  } else {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
  }
}

// Check and send due date reminders
export async function checkDueDateReminders(): Promise<number> {
  try {
    const account = await prisma.slackAccount.findFirst({
      where: { 
        userId: 'default',
        notifications: true
      }
    })

    if (!account) {
      return 0
    }

    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find tasks due in next hour (not yet reminded)
    const tasksDueSoon = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: oneHourFromNow,
          lt: oneDayFromNow
        },
        reminderSent: false,
        status: { not: 'done' }
      },
      take: 10
    })

    let sentCount = 0

    for (const task of tasksDueSoon) {
      const success = await sendSlackNotification({
        taskId: task.id,
        taskTitle: task.title,
        eventType: 'due_soon',
        dueDate: task.dueDate || undefined
      })

      if (success) {
        await prisma.task.update({
          where: { id: task.id },
          data: { reminderSent: true }
        })
        sentCount++
      }
    }

    return sentCount

  } catch (error) {
    console.error('Error checking due date reminders:', error)
    return 0
  }
}

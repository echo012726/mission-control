import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

interface WebhookPayload {
  event: string
  timestamp: string
  data: any
}

async function triggerWebhooks(event: string, data: any) {
  try {
    // Fetch all enabled webhooks that subscribe to this event
    const webhooks = await prisma.webhook.findMany({
      where: { enabled: true },
    })

    if (webhooks.length === 0) return

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    // Filter webhooks that subscribe to this event
    const matchingWebhooks = webhooks.filter((webhook) => {
      const events = JSON.parse(webhook.events || '[]')
      return events.length === 0 || events.includes(event)
    })

    // Trigger each matching webhook
    await Promise.allSettled(
      matchingWebhooks.map(async (webhook) => {
        try {
          const body = JSON.stringify(payload)
          
          // Prepare headers
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }

          // Add HMAC signature if secret is configured
          if (webhook.secret) {
            const signature = crypto
              .createHmac('sha256', webhook.secret)
              .update(body)
              .digest('hex')
            headers['X-Webhook-Signature'] = `sha256=${signature}`
          }

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body,
            // 10 second timeout
            signal: AbortSignal.timeout(10000),
          })

          if (!response.ok) {
            console.error(`Webhook ${webhook.name} failed: ${response.status}`)
          }
        } catch (err) {
          console.error(`Webhook ${webhook.name} error:`, err)
        }
      })
    )
  } catch (error) {
    console.error('Failed to trigger webhooks:', error)
  }
}

// Event trigger helpers
export async function triggerTaskCreated(task: any) {
  await triggerWebhooks('task_created', task)
}

export async function triggerTaskUpdated(task: any, previousStatus?: string) {
  await triggerWebhooks('task_updated', { task, previousStatus })
  
  // Also trigger task_completed if status changed to done
  if (task.status === 'done' && previousStatus && previousStatus !== 'done') {
    await triggerTaskCompleted(task)
  }
}

export async function triggerTaskCompleted(task: any) {
  await triggerWebhooks('task_completed', task)
}

export async function triggerTaskMoved(task: any, previousColumn?: string) {
  await triggerWebhooks('task_moved', { task, previousColumn })
}

export { triggerWebhooks }

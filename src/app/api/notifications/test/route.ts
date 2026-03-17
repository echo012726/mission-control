import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import webpush from 'web-push'

const prisma = new PrismaClient()

// Generate VAPID keys once and store in environment
// In production, generate unique keys: webpush.generateVAPIDKeys()
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAf7-7OT9mBjPZclK1lPdPvKdJcDqWs'

// Configure web-push
webpush.setVapidDetails(
  'mailto:echo012726@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

export async function POST() {
  try {
    const settings = await prisma.notificationSettings.findFirst({
      where: { userId: 'default', enabled: true }
    })

    if (!settings || !settings.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const subscription = JSON.parse(settings.subscription)

    const payload = JSON.stringify({
      title: 'Mission Control',
      body: '🔔 Test notification - Push notifications are working!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'test-notification',
      data: {
        url: '/'
      }
    })

    await webpush.sendNotification(subscription, payload)

    return NextResponse.json({ success: true, message: 'Notification sent' })
  } catch (error: any) {
    console.error('Error sending notification:', error)
    
    // If subscription is no longer valid, disable it
    if (error.statusCode === 410) {
      await prisma.notificationSettings.updateMany({
        where: { userId: 'default', enabled: true },
        data: { enabled: false, subscription: null }
      })
      return NextResponse.json({ error: 'Subscription expired' }, { status: 410 })
    }

    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

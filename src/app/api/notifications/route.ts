import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// VAPID keys - in production, generate unique keys and store in env
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription, enabled, dueDateReminders, assignedTasks, mentions, dailyDigest } = body

    // Get or create notification settings
    let settings = await prisma.notificationSettings.findFirst({
      where: { userId: 'default' }
    })

    if (settings) {
      // Update existing settings
      settings = await prisma.notificationSettings.update({
        where: { id: settings.id },
        data: {
          enabled: enabled ?? settings.enabled,
          dueDateReminders: dueDateReminders ?? settings.dueDateReminders,
          assignedTasks: assignedTasks ?? settings.assignedTasks,
          mentions: mentions ?? settings.mentions,
          dailyDigest: dailyDigest ?? settings.dailyDigest,
          subscription: subscription ? JSON.stringify(subscription) : settings.subscription
        }
      })
    } else {
      // Create new settings
      settings = await prisma.notificationSettings.create({
        data: {
          userId: 'default',
          enabled: enabled ?? false,
          dueDateReminders: dueDateReminders ?? true,
          assignedTasks: assignedTasks ?? true,
          mentions: mentions ?? true,
          dailyDigest: dailyDigest ?? false,
          subscription: subscription ? JSON.stringify(subscription) : null
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      settings,
      vapidPublicKey: VAPID_PUBLIC_KEY
    })
  } catch (error) {
    console.error('Error saving notification settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

export async function GET() {
  try {
    let settings = await prisma.notificationSettings.findFirst({
      where: { userId: 'default' }
    })

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          userId: 'default',
          enabled: false,
          dueDateReminders: true,
          assignedTasks: true,
          mentions: true,
          dailyDigest: false
        }
      })
    }

    // Parse subscription if exists
    const parsedSettings = {
      ...settings,
      subscription: settings.subscription ? JSON.parse(settings.subscription) : null
    }

    return NextResponse.json({ 
      ...parsedSettings,
      vapidPublicKey: VAPID_PUBLIC_KEY
    })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

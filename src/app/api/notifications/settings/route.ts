import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:echo012726@gmail.com',
  process.env.VAPID_PUBLIC_KEY || 'BK6Wk4WoaB0KGTVhoMV7AaNU-uHqPItT76KsGHW6SL3TcAsVTn7z8WqZK6LLMNntpWkv7N_aTRjWMYLRrVS1Ej4',
  process.env.VAPID_PRIVATE_KEY || '5lSiqFhyPTQYDD8oB-kOuW99to_mvfNjdlZBdSmgIeg'
);

// GET - Get notification settings
export async function GET() {
  try {
    let settings = await prisma.notificationSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId: 'default' }
      });
    }
    
    // Get all subscriptions
    const subscriptions = await prisma.pushSubscription.findMany();
    
    return NextResponse.json({ 
      settings,
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        userAgent: s.userAgent,
        createdAt: s.createdAt
      })),
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update notification settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    let settings = await prisma.notificationSettings.findFirst();
    
    if (settings) {
      settings = await prisma.notificationSettings.update({
        where: { id: settings.id },
        data: {
          enabled: body.enabled ?? settings.enabled,
          dueDateReminders: body.dueDateReminders ?? settings.dueDateReminders,
          assignedTasks: body.assignedTasks ?? settings.assignedTasks,
          mentions: body.mentions ?? settings.mentions,
          dailyDigest: body.dailyDigest ?? settings.dailyDigest
        }
      });
    } else {
      settings = await prisma.notificationSettings.create({
        data: {
          userId: 'default',
          enabled: body.enabled ?? false,
          dueDateReminders: body.dueDateReminders ?? true,
          assignedTasks: body.assignedTasks ?? true,
          mentions: body.mentions ?? true,
          dailyDigest: body.dailyDigest ?? false
        }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

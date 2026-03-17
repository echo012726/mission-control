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

// POST - Trigger reminder notifications for tasks due soon
export async function POST() {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Get settings
    const settings = await prisma.notificationSettings.findFirst();
    if (!settings || !settings.enabled || !settings.dueDateReminders) {
      return NextResponse.json({ message: 'Notifications disabled or no settings' });
    }
    
    // Find tasks due in next hour that haven't been reminded
    const upcomingTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: oneHourFromNow
        },
        reminderSent: false,
        status: { not: 'done' }
      },
      take: 10
    });
    
    // Find tasks due in next day (for day-before reminder)
    const tomorrowTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gt: oneHourFromNow,
          lte: oneDayFromNow
        },
        status: { not: 'done' }
      },
      take: 10
    });
    
    const subscriptions = await prisma.pushSubscription.findMany();
    
    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions' });
    }
    
    let sentCount = 0;
    
    // Send notifications for tasks due soon
    for (const task of upcomingTasks) {
      const payload = JSON.stringify({
        title: '⏰ Task Due Soon',
        body: `"${task.title}" is due within the hour!`,
        icon: '/icon-192.png',
        tag: `task-${task.id}`,
        data: { taskId: task.id, url: `/?task=${task.id}` }
      });
      
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sentCount++;
        } catch (e) {
          // Handle expired subscriptions
        }
      }
      
      // Mark as reminded
      await prisma.task.update({
        where: { id: task.id },
        data: { reminderSent: true }
      });
    }
    
    // Send day-before reminders
    for (const task of tomorrowTasks) {
      const payload = JSON.stringify({
        title: '📅 Task Due Tomorrow',
        body: `"${task.title}" is due tomorrow`,
        icon: '/icon-192.png',
        tag: `task-tomorrow-${task.id}`,
        data: { taskId: task.id, url: `/?task=${task.id}` }
      });
      
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sentCount++;
        } catch (e) {
          // Handle expired subscriptions
        }
      }
    }
    
    return NextResponse.json({ 
      message: `Sent ${sentCount} notifications`,
      tasksDueSoon: upcomingTasks.length,
      tasksDueTomorrow: tomorrowTasks.length
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}

// GET - Manual trigger for testing (use POST instead)

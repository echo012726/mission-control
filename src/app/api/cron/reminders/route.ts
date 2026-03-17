import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cron job to check and send due reminders
// Call this endpoint every minute from an external cron service
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    
    // Find tasks with due reminders that haven't been sent
    const tasksWithReminders = await prisma.task.findMany({
      where: {
        reminder: { lte: now },
        reminderSent: false,
        status: { not: 'done' },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        reminder: true,
        priority: true,
      },
    });

    if (tasksWithReminders.length === 0) {
      return NextResponse.json({ 
        message: 'No reminders due',
        processed: 0 
      });
    }

    // Get notification settings
    const notificationSettings = await prisma.notificationSettings.findFirst({
      where: { userId: 'default' }
    });

    const notificationsEnabled = notificationSettings?.enabled ?? false;
    const dueDateRemindersEnabled = notificationSettings?.dueDateReminders ?? true;
    const pushSubscription = notificationSettings?.subscription 
      ? JSON.parse(notificationSettings.subscription) 
      : null;

    let pushSent = 0;
    let pusherTriggered = 0;
    let emailSent = 0;

    // Send notifications for each task
    for (const task of tasksWithReminders) {
      // 1. Send Web Push notification if enabled and subscription exists
      if (notificationsEnabled && dueDateRemindersEnabled && pushSubscription) {
        try {
          const webpush = require('web-push');
          
          // VAPID keys - should match the ones used in the client
          const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
          const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAf7-7OT9mBjMs，丹-ISAC';
          
          webpush.setVapidDetails(
            'mailto:echo012726@gmail.com',
            vapidPublicKey,
            vapidPrivateKey
          );

          const payload = JSON.stringify({
            title: '⏰ Task Reminder',
            body: task.title,
            icon: '/icon-192.png',
            badge: '/icon-96.png',
            tag: `reminder-${task.id}`,
            data: {
              type: 'task-reminder',
              taskId: task.id,
              dueDate: task.dueDate,
            },
            actions: [
              { action: 'open', title: 'Open Task' },
              { action: 'snooze', title: 'Snooze 15min' }
            ]
          });

          await webpush.sendNotification(pushSubscription, payload);
          pushSent++;
          console.log(`Push notification sent for task: ${task.title}`);
        } catch (pushError: any) {
          console.error('Error sending push notification:', pushError.message);
          // If subscription is expired/invalid, clear it
          if (notificationSettings && (pushError.statusCode === 410 || pushError.statusCode === 404)) {
            await prisma.notificationSettings.update({
              where: { id: notificationSettings.id },
              data: { subscription: null }
            });
          }
        }
      }

      // 2. Trigger Pusher event for real-time UI notification
      if (process.env.PUSHER_APP_ID && process.env.PUSHER_SECRET && process.env.NEXT_PUBLIC_PUSHER_KEY) {
        try {
          const Pusher = require('pusher');
          const pusher = new Pusher({
            appId: process.env.PUSHER_APP_ID,
            key: process.env.NEXT_PUBLIC_PUSHER_KEY,
            secret: process.env.PUSHER_SECRET,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true,
          });
          
          await pusher.trigger('mission-control', 'task-reminder', {
            id: task.id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            reminder: task.reminder,
            priority: task.priority,
            timestamp: now.toISOString(),
          });
          pusherTriggered++;
        } catch (pusherError: any) {
          console.error('Error triggering Pusher:', pusherError.message);
        }
      }

      // 3. Send email notification if SMTP configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          // Dynamic import to avoid build errors when not configured
          const nodemailer = await import('nodemailer');
          
          const transporter = nodemailer.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          const priorityLabel = task.priority === '1' ? '🔴 High' : task.priority === '5' ? '🟡 Medium' : '🔵 Low';
          const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';

          await transporter.sendMail({
            from: process.env.SMTP_FROM || 'Mission Control <noreply@missioncontrol.app>',
            to: process.env.NOTIFICATION_EMAIL || 'echo012726@gmail.com',
            subject: `⏰ Reminder: ${task.title}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">⏰ Task Reminder</h2>
                <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #222;">${task.title}</h3>
                  <p style="margin: 5px 0; color: #666;"><strong>Priority:</strong> ${priorityLabel}</p>
                  <p style="margin: 5px 0; color: #666;"><strong>Due:</strong> ${dueDateStr}</p>
                  ${task.description ? `<p style="margin: 10px 0 0 0; color: #555;">${task.description.substring(0, 200)}${task.description.length > 200 ? '...' : ''}</p>` : ''}
                </div>
                <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3456'}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Open Task</a>
              </div>
            `,
          });
          emailSent++;
          console.log(`Email notification sent for task: ${task.title}`);
        } catch (emailError: any) {
          console.error('Error sending email:', emailError.message);
        }
      }
    }

    // Mark reminders as sent
    const taskIds = tasksWithReminders.map(t => t.id);
    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { reminderSent: true },
    });

    // Log the reminder batch with notification stats
    await prisma.activityLog.create({
      data: {
        type: 'reminders_sent',
        payload: JSON.stringify({ 
          count: tasksWithReminders.length, 
          taskIds,
          pushSent,
          pusherTriggered,
          emailSent,
          notificationsEnabled,
        }),
      },
    });

    return NextResponse.json({
      message: `Processed ${tasksWithReminders.length} reminders`,
      processed: tasksWithReminders.length,
      notifications: {
        pushSent,
        pusherTriggered,
        emailSent,
        settingsEnabled: notificationsEnabled,
      },
      tasks: tasksWithReminders.map(t => ({ id: t.id, title: t.title, reminder: t.reminder })),
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 });
  }
}

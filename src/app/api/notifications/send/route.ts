import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// POST - Send a push notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: message, tag, data } = body;
    
    // Get all subscriptions
    const subscriptions = await prisma.pushSubscription.findMany();
    
    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' });
    }
    
    const payload = JSON.stringify({
      title: title || 'Mission Control',
      body: message || 'New notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'notification',
      data: data || {}
    });
    
    const results = [];
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        );
        results.push({ endpoint: sub.endpoint, success: true });
      } catch (error: any) {
        // If subscription is expired, delete it
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id }
          });
          results.push({ endpoint: sub.endpoint, success: false, expired: true });
        } else {
          results.push({ endpoint: sub.endpoint, success: false, error: error.message });
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({ 
      message: `Sent ${successCount}/${subscriptions.length} notifications`,
      results
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

// GET - Send test notification
export async function GET() {
  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    
    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' });
    }
    
    const payload = JSON.stringify({
      title: '🔔 Mission Control Test',
      body: 'Push notifications are working!',
      icon: '/icon-192.png',
      tag: 'test'
    });
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        );
      } catch (error: any) {
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }
    
    return NextResponse.json({ message: 'Test notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}

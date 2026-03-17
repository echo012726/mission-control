import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, p256dh, auth, userAgent } = body;
    
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 });
    }
    
    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    });
    
    if (existing) {
      return NextResponse.json({ 
        id: existing.id, 
        message: 'Already subscribed' 
      });
    }
    
    // Create new subscription
    const subscription = await prisma.pushSubscription.create({
      data: {
        userId: 'default',
        endpoint,
        p256dh,
        auth,
        userAgent: userAgent || 'Unknown'
      }
    });
    
    // Enable notifications
    let settings = await prisma.notificationSettings.findFirst();
    if (settings) {
      await prisma.notificationSettings.update({
        where: { id: settings.id },
        data: { enabled: true }
      });
    } else {
      await prisma.notificationSettings.create({
        data: { userId: 'default', enabled: true }
      });
    }
    
    // Send a welcome notification
    try {
      await webpush.sendNotification(
        { endpoint, keys: { p256dh, auth } },
        JSON.stringify({
          title: 'Mission Control',
          body: 'Push notifications enabled! You\'ll receive task reminders here.',
          icon: '/icon-192.png',
          tag: 'welcome'
        })
      );
    } catch (e) {
      // Subscription might be expired
      console.log('Welcome notification failed (subscription may be expired)');
    }
    
    return NextResponse.json({ 
      id: subscription.id, 
      message: 'Subscribed successfully' 
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }
    
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    
    return NextResponse.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}

// GET - List all subscriptions
export async function GET() {
  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    return NextResponse.json({ error: 'Failed to list subscriptions' }, { status: 500 });
  }
}

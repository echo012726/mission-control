import { NextRequest, NextResponse } from 'next/server';
import { pusherServer, isPusherConfigured } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  // If Pusher is not configured, return error
  if (!isPusherConfigured || !pusherServer) {
    return NextResponse.json(
      { error: 'Pusher not configured' },
      { status: 503 }
    );
  }

  try {
    const data = await req.text();
    const [socketId, channelName] = data
      .split('&')
      .map((part) => part.split('=')[1]);

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing socketId or channelName' },
        { status: 400 }
      );
    }

    // For now, allow all auth (single-user app)
    // In production, validate the user's session
    const auth = channelName.startsWith('presence-')
      ? pusherServer.authorizeChannel(socketId, channelName, {
          user_id: 'user',
          user_info: {},
        })
      : pusherServer.authorizeChannel(socketId, channelName);

    return NextResponse.json(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

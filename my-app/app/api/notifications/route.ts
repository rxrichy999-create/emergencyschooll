import { NextResponse } from 'next/server';
import { appendNotification, readNotifications } from '@/lib/db';

export async function GET() {
  try {
    const notifications = await readNotifications();
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('API notifications GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notification = await appendNotification({
      reportId: body.reportId,
      type: body.type || 'system',
      title: body.title,
      message: body.message,
      urgency: body.urgency,
      status: body.status,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('API notification POST error:', error);
    return NextResponse.json({ error: 'Failed to save notification' }, { status: 400 });
  }
}

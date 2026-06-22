import { NextResponse } from 'next/server';
import { appendNotification, readNotifications } from '@/lib/db';

export async function GET() {
  const notifications = readNotifications();
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notification = appendNotification({
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

import { NextResponse } from 'next/server';

type LineWebhookEvent = {
  source?: {
    type?: 'user' | 'group' | 'room';
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/line/webhook',
    hint: 'LINE must call this endpoint with POST to show groupId logs.',
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { events?: LineWebhookEvent[] };
    console.log(`LINE_WEBHOOK_RECEIVED events=${body.events?.length || 0}`);

    for (const event of body.events || []) {
      if (event.source?.groupId) {
        console.log(`LINE_GROUP_ID=${event.source.groupId}`);
      }

      if (event.source?.roomId) {
        console.log(`LINE_ROOM_ID=${event.source.roomId}`);
      }

      if (event.source?.userId) {
        console.log(`LINE_USER_ID=${event.source.userId}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[LINE webhook] parse error:', error);
    return NextResponse.json({ ok: true });
  }
}

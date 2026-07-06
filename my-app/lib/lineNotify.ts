import { IncidentReport } from './db';

function getLineConfig() {
  return {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    to: process.env.LINE_TO_ID,
  };
}

export function shouldSendLineAlert(report: IncidentReport) {
  return report.id.startsWith('SOS-') || report.urgency === 'critical';
}

export async function sendLineAlert(report: IncidentReport) {
  const { channelAccessToken, to } = getLineConfig();

  if (!channelAccessToken || !to) {
    return { skipped: true };
  }

  const text = [
    'แจ้งเตือนเหตุฉุกเฉิน SafeMaeMoh',
    `รหัส: ${report.id}`,
    `หัวข้อ: ${report.title}`,
    `ระดับ: ${report.urgency}`,
    `สถานที่: ${report.specificLocation}`,
    `ผู้แจ้ง: ${report.isAnonymous ? 'ไม่เปิดเผยตัวตน' : report.reporterName}`,
  ].join('\n');

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      messages: [
        {
          type: 'text',
          text,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE Messaging API failed with status ${response.status}: ${body}`);
  }

  return { skipped: false };
}

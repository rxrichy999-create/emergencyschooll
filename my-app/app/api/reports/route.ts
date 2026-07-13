import { NextResponse } from 'next/server';
import { appendNotification, createReport, readReports, uploadReportAttachment, IncidentReport } from '@/lib/db';
import { sendLineAlert, shouldSendLineAlert } from '@/lib/lineNotify';

type AttachmentPayload = {
  fileName: string;
  contentType: string;
  dataUrl: string;
};

export async function GET() {
  try {
    const reports = await readReports();
    return NextResponse.json(reports);
  } catch (error) {
    console.error('API GET reports error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reportId = body.id || `REP-${Math.floor(100 + Math.random() * 900)}`;
    let attachment: { url: string; name: string } | null = null;
    const attachmentPayload = body.attachment as AttachmentPayload | undefined;

    if (attachmentPayload?.dataUrl) {
      if (!attachmentPayload.contentType.startsWith('image/')) {
        return NextResponse.json({ error: 'Attachment must be an image' }, { status: 400 });
      }

      attachment = await uploadReportAttachment({
        reportId,
        fileName: attachmentPayload.fileName,
        contentType: attachmentPayload.contentType,
        dataUrl: attachmentPayload.dataUrl,
      });
    }

    const newReport: IncidentReport = {
      id: reportId,
      title: body.title,
      category: body.category,
      urgency: body.urgency,
      location: body.location,
      specificLocation: body.specificLocation,
      description: body.description,
      reporterName: body.isAnonymous ? 'ผู้ไม่ประสงค์ออกนาม' : (body.reporterName || 'ผู้ไม่ประสงค์ออกนาม'),
      reporterPhone: body.isAnonymous ? '' : (body.reporterPhone || ''),
      isAnonymous: body.isAnonymous || false,
      geoLocation: body.geoLocation,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      timestamp: new Date().toISOString(),
      status: 'pending',
      timeline: body.timeline || [
        { status: 'pending', time: new Date().toISOString(), note: 'สร้างรายงานเข้าระบบสำเร็จ' }
      ]
    };

    const savedReport = await createReport(newReport);

    await appendNotification({
      reportId: savedReport.id,
      type: savedReport.id.startsWith('SOS-') ? 'sos_triggered' : 'report_created',
      title: savedReport.id.startsWith('SOS-') ? 'แจ้งเตือน SOS ใหม่' : 'รับรายงานเหตุใหม่',
      message: `${savedReport.id}: ${savedReport.title}`,
      urgency: savedReport.urgency,
      status: savedReport.status,
    });

    if (shouldSendLineAlert(savedReport)) {
      try {
        await sendLineAlert(savedReport);
      } catch (lineError) {
        console.error('LINE alert error:', lineError);
      }
    }
    
    return NextResponse.json(savedReport, { status: 201 });
  } catch (error) {
    console.error('API POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 400 });
  }
}

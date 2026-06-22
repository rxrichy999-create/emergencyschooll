import { NextResponse } from 'next/server';
import { appendNotification, readReports, writeReports, IncidentReport } from '@/lib/db';

export async function GET() {
  const reports = readReports();
  // Sort reports by timestamp descending (newest first)
  const sorted = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reports = readReports();
    
    const newReport: IncidentReport = {
      id: body.id || `REP-${Math.floor(100 + Math.random() * 900)}`,
      title: body.title,
      category: body.category,
      urgency: body.urgency,
      location: body.location,
      specificLocation: body.specificLocation,
      description: body.description,
      reporterName: body.isAnonymous ? 'ผู้ไม่ประสงค์ออกนาม' : (body.reporterName || 'ผู้ไม่ประสงค์ออกนาม'),
      reporterPhone: body.isAnonymous ? '' : (body.reporterPhone || ''),
      isAnonymous: body.isAnonymous || false,
      timestamp: new Date().toISOString(),
      status: 'pending',
      timeline: body.timeline || [
        { status: 'pending', time: new Date().toISOString(), note: 'สร้างรายงานเข้าระบบสำเร็จ' }
      ]
    };
    
    reports.unshift(newReport);
    writeReports(reports);

    appendNotification({
      reportId: newReport.id,
      type: newReport.id.startsWith('SOS-') ? 'sos_triggered' : 'report_created',
      title: newReport.id.startsWith('SOS-') ? 'แจ้งเตือน SOS ใหม่' : 'รับรายงานเหตุใหม่',
      message: `${newReport.id}: ${newReport.title}`,
      urgency: newReport.urgency,
      status: newReport.status,
    });
    
    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('API POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { appendNotification, readReports, writeReports } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const reports = readReports();
    
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    const report = reports[index];
    const previousStatus = report.status;
    
    // Update values
    if (body.status) report.status = body.status;
    if (body.adminNotes !== undefined) report.adminNotes = body.adminNotes;
    
    if (body.timeline) {
      report.timeline = body.timeline;
    } else if (body.status || body.adminNotes) {
      // Append a timeline log automatically
      const timeLog = new Date().toISOString();
      const statusLabel = body.status === 'investigating' ? 'กำลังตรวจสอบ' : 'แก้ไขเสร็จสิ้น';
      report.timeline.push({
        status: body.status || report.status,
        time: timeLog,
        note: body.adminNotes || `เปลี่ยนสถานะเป็น: ${statusLabel}`
      });
    }
    
    reports[index] = report;
    writeReports(reports);

    appendNotification({
      reportId: report.id,
      type: 'status_updated',
      title: 'อัปเดตสถานะรายงานเหตุ',
      message: `${report.id}: ${previousStatus} -> ${report.status}${body.adminNotes ? ` (${body.adminNotes})` : ''}`,
      urgency: report.urgency,
      status: report.status,
    });
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('API PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reports = readReports();
    
    const deletedReport = reports.find(r => r.id === id);
    const filtered = reports.filter(r => r.id !== id);
    if (reports.length === filtered.length) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    writeReports(filtered);

    appendNotification({
      reportId: deletedReport?.id,
      type: 'report_deleted',
      title: 'ลบรายงานเหตุ',
      message: deletedReport ? `${deletedReport.id}: ${deletedReport.title}` : `ลบรายงาน ${id}`,
      urgency: deletedReport?.urgency,
      status: deletedReport?.status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 400 });
  }
}

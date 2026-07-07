import { NextResponse } from 'next/server';
import { appendNotification, deleteReport, readReports, updateReport } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const reports = await readReports();
    
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    const report = reports[index];
    const previousStatus = report.status;
    
    // Update values
    if (body.status) report.status = body.status;
    if (body.adminNotes !== undefined) report.adminNotes = body.adminNotes;
    
    if (!Array.isArray(report.timeline)) {
      report.timeline = [];
    }

    if (Array.isArray(body.timeline)) {
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
    
    const updatedReport = await updateReport(report);

    await appendNotification({
      reportId: updatedReport.id,
      type: 'status_updated',
      title: 'อัปเดตสถานะรายงานเหตุ',
      message: `${updatedReport.id}: ${previousStatus} -> ${updatedReport.status}${body.adminNotes ? ` (${body.adminNotes})` : ''}`,
      urgency: updatedReport.urgency,
      status: updatedReport.status,
    });
    
    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('API PATCH error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update report';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { id } = await params;
    const deletedReport = await deleteReport(id);

    if (!deletedReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await appendNotification({
      type: 'report_deleted',
      title: 'ลบรายงานเหตุ',
      message: `${deletedReport.id}: ${deletedReport.title}`,
      urgency: deletedReport.urgency,
      status: deletedReport.status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API DELETE error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete report';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

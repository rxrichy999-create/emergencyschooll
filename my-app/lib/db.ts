import { createClient } from '@supabase/supabase-js';

export interface IncidentReport {
  id: string;
  title: string;
  category: 'accident' | 'bullying' | 'disaster' | 'damage' | 'substance' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location: 'building_a' | 'building_b' | 'digital_business' | 'accounting' | 'cafeteria' | 'sports_complex' | 'auditorium' | 'other';
  specificLocation: string;
  description: string;
  reporterName: string;
  reporterPhone: string;
  isAnonymous: boolean;
  timestamp: string;
  status: 'pending' | 'investigating' | 'resolved';
  adminNotes?: string;
  timeline: {
    status: 'pending' | 'investigating' | 'resolved';
    time: string;
    note: string;
  }[];
}

export interface NotificationHistoryItem {
  id: string;
  reportId?: string;
  type: 'report_created' | 'sos_triggered' | 'status_updated' | 'report_deleted' | 'system';
  title: string;
  message: string;
  urgency?: IncidentReport['urgency'];
  status?: IncidentReport['status'];
  createdAt: string;
}

type ReportRow = {
  id: string;
  title: string;
  category: IncidentReport['category'];
  urgency: IncidentReport['urgency'];
  location: IncidentReport['location'];
  specific_location: string;
  description: string;
  reporter_name: string;
  reporter_phone: string | null;
  is_anonymous: boolean;
  timestamp: string;
  status: IncidentReport['status'];
  admin_notes: string | null;
  timeline: IncidentReport['timeline'];
};

type NotificationRow = {
  id: string;
  report_id: string | null;
  type: NotificationHistoryItem['type'];
  title: string;
  message: string;
  urgency: IncidentReport['urgency'] | null;
  status: IncidentReport['status'] | null;
  created_at: string;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function toReport(row: ReportRow): IncidentReport {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    urgency: row.urgency,
    location: row.location,
    specificLocation: row.specific_location,
    description: row.description,
    reporterName: row.reporter_name,
    reporterPhone: row.reporter_phone || '',
    isAnonymous: row.is_anonymous,
    timestamp: row.timestamp,
    status: row.status,
    adminNotes: row.admin_notes || undefined,
    timeline: row.timeline || [],
  };
}

function toReportRow(report: IncidentReport): ReportRow {
  return {
    id: report.id,
    title: report.title,
    category: report.category,
    urgency: report.urgency,
    location: report.location,
    specific_location: report.specificLocation,
    description: report.description,
    reporter_name: report.reporterName,
    reporter_phone: report.reporterPhone || null,
    is_anonymous: report.isAnonymous,
    timestamp: report.timestamp,
    status: report.status,
    admin_notes: report.adminNotes || null,
    timeline: report.timeline,
  };
}

function toNotification(row: NotificationRow): NotificationHistoryItem {
  return {
    id: row.id,
    reportId: row.report_id || undefined,
    type: row.type,
    title: row.title,
    message: row.message,
    urgency: row.urgency || undefined,
    status: row.status || undefined,
    createdAt: row.created_at,
  };
}

export async function readReports(): Promise<IncidentReport[]> {
  const { data, error } = await getSupabase()
    .from('reports')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as ReportRow[]).map(toReport);
}

export async function createReport(report: IncidentReport): Promise<IncidentReport> {
  const { data, error } = await getSupabase()
    .from('reports')
    .insert(toReportRow(report))
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return toReport(data as ReportRow);
}

export async function updateReport(report: IncidentReport): Promise<IncidentReport> {
  const { data, error } = await getSupabase()
    .from('reports')
    .update(toReportRow(report))
    .eq('id', report.id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return toReport(data as ReportRow);
}

export async function deleteReport(id: string): Promise<IncidentReport | null> {
  const { data: existing, error: readError } = await getSupabase()
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (!existing) {
    return null;
  }

  const { error } = await getSupabase().from('reports').delete().eq('id', id);

  if (error) {
    throw error;
  }

  return toReport(existing as ReportRow);
}

export async function readNotifications(): Promise<NotificationHistoryItem[]> {
  const { data, error } = await getSupabase()
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return ((data || []) as NotificationRow[]).map(toNotification);
}

export async function appendNotification(
  notification: Omit<NotificationHistoryItem, 'id' | 'createdAt'>
): Promise<NotificationHistoryItem> {
  const row: NotificationRow = {
    id: `NTF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    report_id: notification.reportId || null,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    urgency: notification.urgency || null,
    status: notification.status || null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await getSupabase()
    .from('notifications')
    .insert(row)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return toNotification(data as NotificationRow);
}

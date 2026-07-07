'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Interfaces for our application state
interface IncidentReport {
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
  timestamp: Date;
  status: 'pending' | 'investigating' | 'resolved';
  adminNotes?: string;
  timeline: {
    status: 'pending' | 'investigating' | 'resolved';
    time: Date;
    note: string;
  }[];
}

interface NotificationHistoryItem {
  id: string;
  reportId?: string;
  type: 'report_created' | 'sos_triggered' | 'status_updated' | 'report_deleted' | 'system';
  title: string;
  message: string;
  urgency?: IncidentReport['urgency'];
  status?: IncidentReport['status'];
  createdAt: Date;
}

type ApiIncidentReport = Omit<IncidentReport, 'timestamp' | 'timeline'> & {
  timestamp: string;
  timeline: Array<Omit<IncidentReport['timeline'][number], 'time'> & { time: string }>;
};

type ApiNotificationHistoryItem = Omit<NotificationHistoryItem, 'createdAt'> & {
  createdAt: string;
};

const createClientId = (prefix: 'REP' | 'SOS') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const CATEGORY_MAP = {
  accident: { label: 'อุบัติเหตุ / เจ็บป่วย', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' },
  bullying: { label: 'ทะเลาะวิวาท / บูลลี่', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50' },
  disaster: { label: 'ภัยพิบัติ / อัคคีภัย', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' },
  damage: { label: 'อุปกรณ์ / อาคารชำรุด', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' },
  substance: { label: 'สารเสพติด / พฤติกรรม', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50' },
  other: { label: 'อื่นๆ', color: 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200 dark:border-slate-800' },
};

const URGENCY_MAP = {
  low: { label: 'ปกติ', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  medium: { label: 'ปานกลาง', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  high: { label: 'สูง', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 animate-pulse-glow-warning' },
  critical: { label: 'วิกฤต (SOS)', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse-glow border border-rose-300 dark:border-rose-900/50 font-bold' },
};

const STATUS_MAP = {
  pending: { label: 'รอดำเนินการ', color: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
  investigating: { label: 'กำลังตรวจสอบ', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
  resolved: { label: 'ดำเนินการแล้วเสร็จ', color: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' },
};

const LOCATION_MAP = {
  building_a: 'อาคารอำนวยการ',
  building_b: 'อาคารเรียน & โรงฝึกงานช่าง',
  digital_business: 'อาคารเรียน เทคโนโลยีธุรกิจดิจิทัล',
  accounting: 'อาคารเรียน บัญชี',
  cafeteria: 'โรงอาหารและอาคารกิจกรรม',
  sports_complex: 'สนามกีฬา & ลานกิจกรรม',
  auditorium: 'อาคารวิทยบริการ (หอประชุม/ห้องสมุด)',
  other: 'พื้นที่รอบวิทยาลัย / บ้านพักบุคลากร',
};

// Initial Mock Reports to make the site look populated and premium
const INITIAL_REPORTS: IncidentReport[] = [
  {
    id: 'REP-001',
    title: 'นักศึกษาลื่นล้มข้อเท้าแพลงที่ลานกีฬาพละ',
    category: 'accident',
    urgency: 'high',
    location: 'sports_complex',
    specificLocation: 'สนามบาสเกตบอลกลางแจ้ง ข้างโรงฝึกงานช่างยนต์',
    description: 'ระหว่างวิชาพละศึกษา นักศึกษาชั้น ปวช.2 สาขาช่างยนต์ ลื่นเสียหลักล้มกระแทกพื้นปูน คาดว่าข้อเท้าแพลงร้ายแรงไม่สามารถลงน้ำหนักได้ อาจารย์ผู้สอนกำลังทำการประคบเย็นเบื้องต้น ต้องการรถเข็นนำส่งห้องพยาบาลหลัก หรือประสานงานกู้ภัยส่งต่อ รพ.แม่เมาะ ด่วนครับ',
    reporterName: 'นายณรงค์ ศักดิ์ดี (อาจารย์พละ)',
    reporterPhone: '081-234-5678',
    isAnonymous: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    status: 'investigating',
    adminNotes: 'รับแจ้งประสานงานแล้ว งานพยาบาลวิทยาลัยได้นำเปลสนามไปรับตัวนักศึกษาแล้วเพื่อตรวจดูอาการและประคบน้ำแข็ง หากจำเป็นจะประสานรถพยาบาล กฟผ. แม่เมาะ หรือกู้ภัยนำส่ง รพ.แม่เมาะ ทันที',
    timeline: [
      { status: 'pending', time: new Date(Date.now() - 1000 * 60 * 15), note: 'ส่งรายงานเข้าสู่ระบบโดยครูผู้สอน' },
      { status: 'investigating', time: new Date(Date.now() - 1000 * 60 * 10), note: 'งานพยาบาลรับทราบเรื่อง และส่งทีมปฐมพยาบาลวิทยาลัยเข้าพื้นที่' }
    ]
  },
  {
    id: 'REP-002',
    title: 'ก๊อกน้ำรั่วไหลไม่หยุดบริเวณอ่างล้างมือชำรุด',
    category: 'damage',
    urgency: 'low',
    location: 'cafeteria',
    specificLocation: 'อ่างน้ำล้างมือหน้าโรงอาหารวิทยาลัย',
    description: 'ก๊อกน้ำตัวที่ 3 ตรงอ่างล้างมือก่อนเข้าโรงอาหารชำรุดปิดไม่สนิท น้ำรั่วพุ่งกระจายและไหลนองเต็มพื้นทางเดิน นักศึกษาเดินผ่านไปมาเสี่ยงต่อการลื่นล้มได้ อยากให้ช่างซ่อมบำรุงวิทยาลัยมาช่วยปิดวาล์วและเปลี่ยนตัวใหม่ด่วนครับ',
    reporterName: 'นายอภิชาต พลอยดี (ปวส.1)',
    reporterPhone: '',
    isAnonymous: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    status: 'resolved',
    adminNotes: 'ฝ่ายงานซ่อมบำรุงและอาคารสถานที่ได้ส่งเจ้าหน้าที่เข้าดำเนินการปิดวาล์วน้ำหลัก เปลี่ยนหัวก๊อกใหม่ และเช็ดพื้นรอบๆ ให้แห้งสนิทเรียบร้อยแล้วเพื่อความปลอดภัย',
    timeline: [
      { status: 'pending', time: new Date(Date.now() - 1000 * 60 * 120), note: 'นักศึกษาแจ้งรายงานเข้าระบบแบบไม่เปิดเผยตัวตน' },
      { status: 'investigating', time: new Date(Date.now() - 1000 * 60 * 95), note: 'หัวหน้างานอาคารสถานที่รับเรื่องและมอบหมายงานให้ทีมช่างบำรุงวิทยาลัย' },
      { status: 'resolved', time: new Date(Date.now() - 1000 * 60 * 45), note: 'ช่างวิทยาลัยเข้าแก้ไขและเปลี่ยนอุปกรณ์ชิ้นใหม่สำเร็จ' }
    ]
  },
  {
    id: 'REP-003',
    title: 'พบกลิ่นเหม็นไหม้คล้ายสายไฟร้อนเกินในห้องเรียนคอมพิวเตอร์',
    category: 'damage',
    urgency: 'medium',
    location: 'auditorium',
    specificLocation: 'อาคารวิทยบริการ ชั้น 2 ห้องคอมพิวเตอร์ 203',
    description: 'มีกลิ่นเหม็นไหม้ของพลาสติกและสายไฟร้อนเกินบริเวณหลังเครื่องสำรองไฟ (UPS) ตัวใหญ่ประจำห้องเรียนคอมพิวเตอร์ คณะครูเวรประสานงานปิดระบบเบรกเกอร์ห้องคอมพิวเตอร์ชั่วคราวเพื่อความปลอดภัย และรอช่างวิทยาลัยเข้าสแกนระบบไฟฟ้าในอาคาร',
    reporterName: 'นางสาวจารุวรรณ แก้วใส (ครูเวรประจำตึก)',
    reporterPhone: '089-987-6543',
    isAnonymous: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 300), // 5 hours ago
    status: 'pending',
    timeline: [
      { status: 'pending', time: new Date(Date.now() - 1000 * 60 * 300), note: 'รายงานบันทึกเข้าสู่ระบบโดยครูเวรวิทยบริการ' }
    ]
  },
  {
    id: 'REP-004',
    title: 'พบกลุ่มควันหนาแน่นเนื่องจากหญ้าแห้งติดไฟใกล้หม้อแปลงไฟฟ้าหลังโรงงานฝึกงาน',
    category: 'disaster',
    urgency: 'critical',
    location: 'building_b',
    specificLocation: 'บริเวณหลังโรงฝึกงานแผนกช่างไฟฟ้าและอิเล็กทรอนิกส์',
    description: 'เกิดประกายไฟจากเศษใบไม้และหญ้าแห้งสะสมใกล้แนวรั้วสถานีจ่ายไฟย่อยและหม้อแปลงทดสอบของแผนกช่างไฟฟ้า มีกลุ่มควันหนาแน่นลอยเข้ามาในพื้นที่โรงฝึกงาน อาจารย์และนักเรียนได้นำถังดับเพลิงเคมีแห้งฉีดระงับความร้อนสะสมเบื้องต้นเรียบร้อยแล้ว ปัจจุบันปลอดภัยดีแต่ขอให้เจ้าหน้าที่เซฟตี้วิทยาลัยและฝ่ายดับเพลิง กฟผ. แม่เมาะ เข้าร่วมสแกนระบบและประเมินความปลอดภัยระบบไฟอีกครั้ง',
    reporterName: 'เจ้าหน้าที่ความปลอดภัยห้องปฏิบัติการไฟฟ้า',
    reporterPhone: '085-555-4321',
    isAnonymous: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 1440), // 1 day ago
    status: 'resolved',
    adminNotes: 'ทีมเทคนิคและไฟฟ้าวิทยาลัย ร่วมกับเจ้าหน้าที่ดับเพลิง กฟผ. แม่เมาะ ได้เข้าตรวจสอบจุดเกิดเหตุ ทำแนวกันไฟ กำจัดวัชพืชแห้งรอบรั้วสถานีทดสอบ และเปลี่ยนฟิวส์แรงสูงที่ได้รับความร้อนชำรุดเรียบร้อย ยืนยันความปลอดภัย',
    timeline: [
      { status: 'pending', time: new Date(Date.now() - 1000 * 60 * 1440), note: 'ระบบตรวจพบควันไฟ ส่งสัญญาณ SOS ด่วนไปยังศูนย์ความปลอดภัย' },
      { status: 'investigating', time: new Date(Date.now() - 1000 * 60 * 1435), note: 'ทีมระงับอัคคีภัยแผนกช่างและหน่วยดับเพลิง กฟผ. เข้าพื้นที่คุมสถานการณ์' },
      { status: 'resolved', time: new Date(Date.now() - 1000 * 60 * 1200), note: 'ทำแนวกันไฟ กำจัดวัชพืชแห้ง และซ่อมบำรุงระบบจ่ายไฟเสร็จสิ้น' }
    ]
  }
];

export function EduSafeDashboard({ defaultAdminMode = false }: { defaultAdminMode?: boolean }) {
  const pathname = usePathname();
  const isAdminRoute = defaultAdminMode || pathname?.startsWith('/admin') === true;
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentReport['category']>('accident');
  const [urgency, setUrgency] = useState<IncidentReport['urgency']>('medium');
  const [location, setLocation] = useState<IncidentReport['location']>('building_a');
  const [specificLocation, setSpecificLocation] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mapLocationFilter, setMapLocationFilter] = useState<string>('all');

  // App Modes and UI controllers
  const isAdminMode = defaultAdminMode || isAdminRoute;
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSosModal, setShowSosModal] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' | 'info' } | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Fetch all reports from our new backend API database
  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = (await res.json()) as ApiIncidentReport[];
        // Parse date strings back into Date objects for the React state
        const parsed = data.map((r) => ({
          ...r,
          timestamp: new Date(r.timestamp),
          timeline: r.timeline.map((tl) => ({ ...tl, time: new Date(tl.time) }))
        }));
        setReports(parsed);
      } else {
        loadFromLocalStorage();
      }
    } catch {
      loadFromLocalStorage();
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = (await res.json()) as ApiNotificationHistoryItem[];
        const parsed = data.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
        setNotifications(parsed);
      }
    } catch {
      setNotifications([]);
    }
  };

  const getApiErrorMessage = async (res: Response, fallback: string) => {
    try {
      const data = (await res.json()) as { error?: string };
      return data.error || fallback;
    } catch {
      return fallback;
    }
  };

  // Fallback hydration from local storage if API is offline
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('edusafe_reports');
    if (saved) {
      try {
        const parsed = (JSON.parse(saved) as ApiIncidentReport[]).map((r) => ({
          ...r,
          timestamp: new Date(r.timestamp),
          timeline: r.timeline.map((tl) => ({ ...tl, time: new Date(tl.time) }))
        }));
        setReports(parsed);
      } catch {
        setReports(INITIAL_REPORTS);
      }
    } else {
      setReports(INITIAL_REPORTS);
    }
  };

  const saveToLocalStorage = (newReport: IncidentReport) => {
    const updated = [newReport, ...reports];
    setReports(updated);
    localStorage.setItem('edusafe_reports', JSON.stringify(updated));
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchReports();
      await fetchNotifications();
    };

    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle Form Submission via API POST
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || (!isAnonymous && !reporterName.trim())) {
      showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'danger');
      return;
    }

    const newReportData: Omit<IncidentReport, 'timestamp' | 'status' | 'timeline'> = {
      id: createClientId('REP'),
      title: title.trim(),
      category,
      urgency,
      location,
      specificLocation: specificLocation.trim(),
      description: description.trim(),
      reporterName: isAnonymous ? 'ผู้ไม่ประสงค์ออกนาม' : reporterName.trim(),
      reporterPhone: isAnonymous ? '' : reporterPhone.trim(),
      isAnonymous,
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReportData)
      });
      
      if (res.ok) {
        await fetchReports();
        await fetchNotifications();
        showToast(`ส่งรายงานเหตุหมายเลข ${newReportData.id} สำเร็จ เจ้าหน้าที่ได้รับเรื่องแล้ว`, 'success');
      } else {
        // Fallback
        const fallbackReport: IncidentReport = {
          ...newReportData,
          timestamp: new Date(),
          status: 'pending',
          timeline: [{ status: 'pending', time: new Date(), note: 'สร้างรายงานเข้าระบบสำเร็จ (บันทึกเฉพาะในเครื่อง)' }]
        };
        saveToLocalStorage(fallbackReport);
        showToast(`บันทึกเหตุในเครื่องสำเร็จ (เซิร์ฟเวอร์ขัดข้อง)`, 'info');
      }
    } catch {
      // Fallback
      const fallbackReport: IncidentReport = {
        ...newReportData,
        timestamp: new Date(),
        status: 'pending',
        timeline: [{ status: 'pending', time: new Date(), note: 'สร้างรายงานเข้าระบบสำเร็จ (บันทึกเฉพาะในเครื่อง)' }]
      };
      saveToLocalStorage(fallbackReport);
      showToast(`บันทึกเหตุในเครื่องสำเร็จ (เซิร์ฟเวอร์ออฟไลน์)`, 'info');
    }

    // Reset Form
    setTitle('');
    setSpecificLocation('');
    setDescription('');
    setReporterName('');
    setReporterPhone('');
    setIsAnonymous(false);
  };

  // Dispatch Simulated Instant SOS via API POST
  const handleTriggerSOS = async (emergencyType: string) => {
    const sosId = createClientId('SOS');
    const newReportData: Omit<IncidentReport, 'timestamp' | 'status' | 'timeline'> = {
      id: sosId,
      title: `⚡ สัญญาณแจ้งเหตุฉุกเฉินด่วน: ${emergencyType}`,
      category: emergencyType === 'อัคคีภัย / ควันไฟ' ? 'disaster' : 'accident',
      urgency: 'critical',
      location: 'other',
      specificLocation: 'ไม่ระบุพิกัดชัดเจน (ส่งสัญญาณด่วนจากปุ่ม SOS หน้าแรก)',
      description: `ระบบส่งสัญญาณขอความช่วยเหลือเร่งด่วนชนิด: ${emergencyType} ขอความกรุณาเจ้าหน้าที่เวร เจ้าหน้าที่ความปลอดภัย และครูพยาบาลเข้าพื้นที่รับผิดชอบและสแกนพื้นที่โดยรอบเพื่อช่วยเหลืออย่างเร่งด่วนที่สุด!`,
      reporterName: 'ปุ่มฉุกเฉิน SOS (หน้าหลัก)',
      reporterPhone: 'สายด่วนโรงเรียน',
      isAnonymous: false,
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReportData)
      });
      if (res.ok) {
        await fetchReports();
        await fetchNotifications();
        showToast(`🚨 ส่งรหัสเตือนภัยวิกฤต ${sosId} ไปยังทีมระงับเหตุแล้ว!`, 'success');
      } else {
        const fallbackReport: IncidentReport = {
          ...newReportData,
          timestamp: new Date(),
          status: 'pending',
          timeline: [{ status: 'pending', time: new Date(), note: 'ส่งสัญญาณ SOS สำเร็จ (บันทึกเฉพาะในเครื่อง)' }]
        };
        saveToLocalStorage(fallbackReport);
        showToast(`🚨 ส่ง SOS สำเร็จ (จำลองเก็บในเครื่อง)`, 'success');
      }
    } catch {
      const fallbackReport: IncidentReport = {
        ...newReportData,
        timestamp: new Date(),
        status: 'pending',
        timeline: [{ status: 'pending', time: new Date(), note: 'ส่งสัญญาณ SOS สำเร็จ (บันทึกเฉพาะในเครื่อง)' }]
      };
      saveToLocalStorage(fallbackReport);
      showToast(`🚨 ส่ง SOS สำเร็จ (จำลองเก็บในเครื่อง)`, 'success');
    }
    setShowSosModal(false);
  };

  // Update Status by Admin via API PATCH
  const handleUpdateStatus = async (id: string, newStatus: IncidentReport['status']) => {
    const patchData = {
      status: newStatus,
      adminNotes: adminNoteInput.trim() || undefined
    };

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData)
      });

      if (res.ok) {
        const updatedFromServer = (await res.json()) as ApiIncidentReport;
        const parsedReport = {
          ...updatedFromServer,
          timestamp: new Date(updatedFromServer.timestamp),
          timeline: updatedFromServer.timeline.map((tl) => ({ ...tl, time: new Date(tl.time) }))
        };

        const updatedList = reports.map(r => r.id === id ? parsedReport : r);
        setReports(updatedList);
        setSelectedReport(parsedReport);
        setAdminNoteInput('');
        await fetchNotifications();
        showToast(`อัปเดตสถานะใบงานเป็น [${STATUS_MAP[newStatus].label}] เรียบร้อย`, 'success');
      } else {
        const errorMessage = await getApiErrorMessage(res, 'ล้มเหลวในการเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้าน');
        showToast(res.status === 401 ? 'เซสชันแอดมินหมดอายุ กรุณาเข้าสู่ระบบใหม่' : errorMessage, 'danger');
      }
    } catch {
      showToast('ออฟไลน์: ไม่สามารถอัปเดตสถานะบนฐานข้อมูลส่วนกลางได้', 'danger');
    }
  };

  // Delete Report by Admin via API DELETE
  const handleDeleteReport = async (id: string) => {
    if (confirm('คุณต้องการลบรายงานนี้ออกจากระบบอย่างถาวรใช่หรือไม่?')) {
      try {
        const res = await fetch(`/api/reports/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          const updated = reports.filter(r => r.id !== id);
          setReports(updated);
          setSelectedReport(null);
          await fetchNotifications();
          showToast('ลบรายการแจ้งเหตุสำเร็จ', 'info');
        } else {
          showToast(res.status === 401 ? 'เซสชันแอดมินหมดอายุ กรุณาเข้าสู่ระบบใหม่' : 'ไม่สามารถลบรายการได้เนื่องจากขัดข้องทางเซิร์ฟเวอร์', 'danger');
        }
      } catch {
        showToast('ออฟไลน์: ไม่สามารถดำเนินการลบจากฐานข้อมูลได้', 'danger');
      }
    }
  };

  const showToast = (message: string, type: 'success' | 'danger' | 'info') => {
    setToast({ message, type });
  };

  // Statistics Computations
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    investigating: reports.filter(r => r.status === 'investigating').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    criticalCount: reports.filter(r => r.urgency === 'critical' && r.status !== 'resolved').length,
    notificationCount: notifications.length,
  };

  const filterReports = () => {
    return reports.filter(r => {
      const matchCategory = categoryFilter === 'all' || r.category === categoryFilter;
      const matchUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchMap = mapLocationFilter === 'all' || r.location === mapLocationFilter;
      return matchCategory && matchUrgency && matchStatus && matchMap;
    });
  };

  const filteredReports = filterReports();

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-[#0b0f19] text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce shadow-2xl rounded-xl overflow-hidden max-w-sm flex items-center border">
          <div className={`p-4 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white border-emerald-600' : 
            toast.type === 'danger' ? 'bg-rose-500 text-white border-rose-600' : 
            'bg-blue-500 text-white border-blue-600'
          }`}>
            {toast.type === 'success' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {toast.type === 'danger' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <div className="px-4 py-3 bg-white dark:bg-zinc-900 text-sm font-medium text-slate-800 dark:text-zinc-200">
            {toast.message}
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden flex-shrink-0 dark:bg-zinc-900 dark:ring-zinc-800">
              <Image
                src="/mae-moh-logo.png"
                alt="วิทยาลัยเทคนิค กฟผ. แม่เมาะ"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                SafeMaeMoh <span className="hidden sm:inline-flex text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-normal px-2 py-0.5 rounded-full border border-indigo-500/20">วท. กฟผ. แม่เมาะ</span>
              </h1>
              <p className="hidden md:block text-[10px] text-slate-500 dark:text-zinc-400">ระบบรายงานเหตุและจัดการความปลอดภัย วิทยาลัยเทคนิค กฟผ. แม่เมาะ</p>
            </div>
          </div>

          {/* Quick Header Widgets */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Status light */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                {stats.criticalCount > 0 ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                )}
              </span>
              <span className="text-slate-600 dark:text-zinc-300">
                สถานะสถานศึกษา: {stats.criticalCount > 0 ? `เฝ้าระวังภัยพิบัติพิเศษ (${stats.criticalCount})` : 'ปลอดภัยดี'}
              </span>
            </div>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors text-slate-600 dark:text-zinc-300"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 117.07 7.07l-2.828-2.828z" /></svg>
              )}
            </button>

            {isAdminRoute ? (
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white shadow-md">
                  โหมดผู้ดูแลระบบ
                </span>
                <button
                  onClick={async () => {
                    await fetch('/api/admin/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className="rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline rounded-xl bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  ผู้ใช้ทั่วไป
                </span>
                <Link
                  href="/admin"
                  className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3l7 3v5c0 4.5-2.9 8.6-7 10-4.1-1.4-7-5.5-7-10V6l7-3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" /></svg>
                  ผู้ดูแลระบบ
                </Link>
              </div>
            )}

          </div>
        </div>
      </header>

      {showWelcomePopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4 py-6 animate-fadeIn">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setShowWelcomePopup(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white ring-1 ring-white/40 transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/70"
              aria-label="ปิดหน้าต่างประกาศ"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <Image
              src="/welcome-popup.png"
              alt="ประกาศสถิตในดวงใจตราบนิรันดร์"
              width={1160}
              height={1396}
              className="max-h-[88vh] w-full object-contain"
              priority
            />
            <div className="hidden absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.28),transparent_38%),linear-gradient(145deg,rgba(15,23,42,0.94),rgba(2,6,23,1))]" />
            <div className="hidden relative px-6 pb-6 pt-10 text-center">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white p-2 shadow-xl ring-4 ring-white/15">
                <Image
                  src="/mae-moh-logo.png"
                  alt="วิทยาลัยเทคนิค กฟผ. แม่เมาะ"
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-200">SafeMaeMoh</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">ระบบความปลอดภัยวิทยาลัย</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                ระบบรายงานเหตุและประสานงานความปลอดภัย วิทยาลัยเทคนิค กฟผ. แม่เมาะ
              </p>
              <div className="mt-5 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left text-xs leading-relaxed text-slate-200">
                หากพบเหตุฉุกเฉินให้กดปุ่ม SOS หรือกรอกรายงานเหตุทั่วไป ระบบจะส่งข้อมูลไปยังผู้ดูแลเพื่อดำเนินการทันที
              </div>
              <button
                type="button"
                onClick={() => setShowWelcomePopup(false)}
                className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-slate-100"
              >
                เริ่มใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Banner Section */}
        <div className="relative mb-6 sm:mb-8 rounded-3xl overflow-hidden bg-gradient-to-r from-rose-900 via-indigo-950 to-slate-950 p-5 sm:p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 opacity-15 transform translate-x-20 -translate-y-10 scale-125 hidden lg:block pointer-events-none">
            {/* Background design */}
            <svg width="400" height="400" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" strokeDasharray="10 5" />
              <path d="M50 20v60M20 50h60" stroke="white" strokeWidth="1" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-3 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                แจ้งเหตุด่วน 24 ชั่วโมง
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                ระบบจัดการความปลอดภัยและภัยพิบัติ วิทยาลัยเทคนิค กฟผ. แม่เมาะ
              </h2>
              <p className="mt-2 text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
                หากพบเหตุด่วน เหตุไฟฟ้า/เครื่องจักรชำรุดในโรงฝึกงาน, อุบัติเหตุการเรียน, สารเคมีรั่วไหล หรือภัยไฟป่ารอบวิทยาลัย รายงานเข้าสู่ระบบได้ทันที 
                ข้อมูลผู้แจ้งจะถูกจัดเก็บเป็นความลับสูงสุด หรือสามารถเลือกรายงานไม่ระบุตัวตน (Anonymous) ได้
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-shrink-0">
              <button
                onClick={() => setShowSosModal(true)}
                className="px-5 py-3 sm:px-6 sm:py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-base sm:text-lg tracking-wide shadow-lg shadow-red-600/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 animate-pulse-glow w-full sm:w-auto"
              >
                <span className="flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                แจ้งเหตุฉุกเฉิน (SOS)
              </button>
              
              <a
                href="#report-form"
                className="px-5 py-3 sm:px-6 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-sm sm:text-base text-center transition-all hover:border-white/40 flex items-center justify-center w-full sm:w-auto"
              >
                กรอกรายงานเหตุทั่วไป
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic Statistics Cards */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 mb-8">
          
          <div className="glass-panel p-4 sm:p-5 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">เหตุแจ้งทั้งหมด</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="glass-panel p-4 sm:p-5 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
              รอดำเนินการ
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-amber-500">{stats.pending}</span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="glass-panel p-4 sm:p-5 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              กำลังดำเนินการ
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-blue-500">{stats.investigating}</span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${stats.total ? (stats.investigating / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="glass-panel p-4 sm:p-5 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              แก้ไขเสร็จสิ้น
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-500">{stats.resolved}</span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${stats.total ? (stats.resolved / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

        </section>

        <section className="glass-panel p-4 sm:p-6 rounded-3xl shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                </svg>
                ประวัติการแจ้งเตือน
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">บันทึกเหตุการณ์ล่าสุดจากการแจ้งเหตุ, SOS, การอัปเดตสถานะ และการลบรายการ</p>
            </div>

            <button
              onClick={fetchNotifications}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-300 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเฟรชประวัติ
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-6 text-center">
              <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">ยังไม่มีประวัติการแจ้งเตือน</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">เมื่อมีการแจ้งเหตุหรืออัปเดตสถานะ ระบบจะบันทึกไว้ที่นี่อัตโนมัติ</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {notifications.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`h-2.5 w-2.5 mt-1 rounded-full flex-shrink-0 ${
                      item.type === 'sos_triggered' ? 'bg-rose-500 animate-ping' :
                      item.type === 'status_updated' ? 'bg-blue-500' :
                      item.type === 'report_deleted' ? 'bg-slate-400' :
                      'bg-emerald-500'
                    }`} />
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">{item.message}</p>
                  {item.reportId && (
                    <span className="mt-3 inline-flex rounded-lg bg-slate-100 dark:bg-zinc-800 px-2 py-1 text-[10px] font-mono font-semibold text-slate-500 dark:text-zinc-300">
                      {item.reportId}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Map and Charts Grid Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Interactive School Floor Map (Takes 2 Columns on Large Screens) */}
          <div className="lg:col-span-2 glass-panel p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    แผนที่วิทยาเขตและการแจ้งเตือนจุดเสี่ยง
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">คลิกที่อาคารต่างๆ บนแผนที่จำลองเพื่อจำกัดพื้นที่แสดงการแจ้งเหตุ</p>
                </div>

                {mapLocationFilter !== 'all' && (
                  <button 
                    onClick={() => setMapLocationFilter('all')}
                    className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1"
                  >
                    แสดงทั้งหมด
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {/* Map SVG container */}
              <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-100/50 dark:bg-zinc-900/40 p-2 sm:p-4 min-h-[300px] flex items-center justify-center">
                <svg className="w-full max-w-xl h-auto" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines background */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-zinc-800" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" className="rounded-xl opacity-30" />

                  {/* Campus Grounds outline */}
                  <path d="M 50 380 Q 400 420 750 380 Q 780 200 700 70 Q 350 40 100 70 Q 30 200 50 380 Z" strokeWidth="2" strokeDasharray="5 5" className="fill-slate-200/50 stroke-slate-300 dark:fill-zinc-900/60 dark:stroke-zinc-800" />

                  {/* Roadways / Walkways inside school */}
                  <path d="M 250 80 Q 350 200 400 380 M 100 240 H 700" stroke="currentColor" strokeWidth="20" strokeLinecap="round" className="text-slate-200 dark:text-zinc-900 opacity-60" />

                  {/* Sports Complex Area */}
                  <g 
                    className="cursor-pointer group transition-all"
                    onClick={() => {
                      setMapLocationFilter('sports_complex');
                      showToast('กรองเฉพาะข้อมูล: สนามกีฬา & ลานกิจกรรม', 'info');
                    }}
                  >
                    <rect 
                      x="480" y="80" width="220" height="130" rx="15" 
                      fill={mapLocationFilter === 'sports_complex' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(30, 41, 59, 0.05)'} 
                      stroke={mapLocationFilter === 'sports_complex' ? '#4f46e5' : '#94a3b8'} 
                      strokeWidth={mapLocationFilter === 'sports_complex' ? '3' : '1.5'} 
                      className="group-hover:fill-slate-300/40 dark:group-hover:fill-zinc-800/40 transition-colors"
                    />
                    {/* Basketball Court design inside */}
                    <rect x="520" y="110" width="140" height="70" rx="4" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400 opacity-50" />
                    <circle cx="590" cy="145" r="20" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400 opacity-50" />
                    <line x1="590" y1="110" x2="590" y2="180" stroke="currentColor" strokeWidth="1" className="text-slate-400 opacity-50" />
                    
                    <text x="590" y="65" textAnchor="middle" className="fill-slate-600 dark:fill-zinc-300 text-sm font-semibold">ลานกีฬา & สนามฟุตบอล</text>
                    {/* Pulsing indicator if has active high-incident */}
                    {reports.some(r => r.location === 'sports_complex' && r.status !== 'resolved') && (
                      <circle cx="590" cy="145" r="8" className="fill-orange-500 animate-ping" />
                    )}
                  </g>

                  {/* Academic Building A */}
                  <g 
                    className="cursor-pointer group transition-all"
                    onClick={() => {
                      setMapLocationFilter('building_a');
                      showToast('กรองเฉพาะข้อมูล: อาคารอำนวยการ', 'info');
                    }}
                  >
                    <rect 
                      x="80" y="100" width="160" height="100" rx="15" 
                      fill={mapLocationFilter === 'building_a' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(30, 41, 59, 0.05)'} 
                      stroke={mapLocationFilter === 'building_a' ? '#4f46e5' : '#94a3b8'} 
                      strokeWidth={mapLocationFilter === 'building_a' ? '3' : '1.5'}
                      className="group-hover:fill-slate-300/40 dark:group-hover:fill-zinc-800/40 transition-colors"
                    />
                    <path d="M 120 120 H 200 M 120 150 H 200 M 120 180 H 200" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-slate-400 opacity-30" />
                    <text x="160" y="85" textAnchor="middle" className="fill-slate-600 dark:fill-zinc-300 text-sm font-semibold">อาคารอำนวยการ</text>
                    
                    {reports.some(r => r.location === 'building_a' && r.status !== 'resolved') && (
                      <circle cx="160" cy="150" r="8" className="fill-red-500 animate-ping" />
                    )}
                  </g>

                  {/* Academic Building B */}
                  <g 
                    className="cursor-pointer group transition-all"
                    onClick={() => {
                      setMapLocationFilter('building_b');
                      showToast('กรองเฉพาะข้อมูล: อาคารเรียน & โรงฝึกงานช่าง', 'info');
                    }}
                  >
                    <rect 
                      x="80" y="270" width="160" height="100" rx="15" 
                      fill={mapLocationFilter === 'building_b' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(30, 41, 59, 0.05)'} 
                      stroke={mapLocationFilter === 'building_b' ? '#4f46e5' : '#94a3b8'} 
                      strokeWidth={mapLocationFilter === 'building_b' ? '3' : '1.5'}
                      className="group-hover:fill-slate-300/40 dark:group-hover:fill-zinc-800/40 transition-colors"
                    />
                    <path d="M 120 290 H 200 M 120 320 H 200 M 120 350 H 200" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-slate-400 opacity-30" />
                    <text x="160" y="395" textAnchor="middle" className="fill-slate-600 dark:fill-zinc-300 text-sm font-semibold">ตึกเรียน & โรงฝึกงานช่าง</text>
                    
                    {reports.some(r => r.location === 'building_b' && r.status !== 'resolved') && (
                      <circle cx="160" cy="320" r="8" className="fill-amber-500 animate-ping" />
                    )}
                  </g>

                  {/* Digital Business Technology Building */}
                  <g
                    className="cursor-pointer group transition-all"
                    onClick={() => {
                      setMapLocationFilter('digital_business');
                      showToast('กรองเฉพาะข้อมูล: อาคารเรียน เทคโนโลยีธุรกิจดิจิทัล', 'info');
                    }}
                  >
                    <rect
                      x="285" y="75" width="150" height="95" rx="15"
                      fill={mapLocationFilter === 'digital_business' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(30, 41, 59, 0.05)'}
                      stroke={mapLocationFilter === 'digital_business' ? '#4f46e5' : '#94a3b8'}
                      strokeWidth={mapLocationFilter === 'digital_business' ? '3' : '1.5'}
                      className="group-hover:fill-slate-300/40 dark:group-hover:fill-zinc-800/40 transition-colors"
                    />
                    <rect x="315" y="101" width="90" height="42" rx="5" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 opacity-40" />
                    <path d="M 340 153 H 380" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-slate-400 opacity-30" />
                    <text x="360" y="58" textAnchor="middle" className="fill-slate-600 dark:fill-zinc-300 text-sm font-semibold">เทคโนโลยีธุรกิจดิจิทัล</text>

                    {reports.some(r => r.location === 'digital_business' && r.status !== 'resolved') && (
                      <circle cx="360" cy="123" r="8" className="fill-blue-500 animate-ping" />
                    )}
                  </g>

                  {/* Accounting Building */}
                  <g
                    className="cursor-pointer group transition-all"
                    onClick={() => {
                      setMapLocationFilter('accounting');
                      showToast('กรองเฉพาะข้อมูล: อาคารเรียน บัญชี', 'info');
                    }}
                  >
                    <rect
                      x="310" y="350" width="140" height="70" rx="15"
                      fill={mapLocationFilter === 'accounting' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(30, 41, 59, 0.05)'}
                      stroke={mapLocationFilter === 'accounting' ? '#4f46e5' : '#94a3b8'}
                      strokeWidth={mapLocationFilter === 'accounting' ? '3' : '1.5'}
                      className="group-hover:fill-slate-300/40 dark:group-hover:fill-zinc-800/40 transition-colors"
                    />
                    <path d="M 340 370 H 420 M 340 390 H 420 M 340 410 H 395" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-slate-400 opacity-30" />
                    <text x="380" y="340" textAnchor="middle" className="fill-slate-600 dark:fill-zinc-300 text-sm font-semibold">อาคารเรียน บัญชี</text>

                    {reports.some(r => r.location === 'accounting' && r.status !== 'resolved') && (
                      <circle cx="380" cy="385" r="8" className="fill-emerald-500 animate-ping" />
                    )}
                  </g>

                  {/* Cafeteria */}
                  <g 
                    className="cursor-pointer group transition-all"
                    onClick={() => {
                      setMapLocationFilter('cafeteria');
                      showToast('กรองเฉพาะข้อมูล: โรงอาหารและกิจกรรม', 'info');
                    }}
                  >
                    <polygon 
                      points="310,230 430,230 450,330 290,330" 
                      fill={mapLocationFilter === 'cafeteria' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(30, 41, 59, 0.05)'} 
                      stroke={mapLocationFilter === 'cafeteria' ? '#4f46e5' : '#94a3b8'} 
                      strokeWidth={mapLocationFilter === 'cafeteria' ? '3' : '1.5'}
                      className="group-hover:fill-slate-300/40 dark:group-hover:fill-zinc-800/40 transition-colors"
                    />
                    <circle cx="370" cy="280" r="15" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400 opacity-40" />
                    <path d="M 370 270 V 290 M 360 280 H 380" stroke="currentColor" strokeWidth="1" className="text-slate-400 opacity-40" />
                    <text x="370" y="215" textAnchor="middle" className="fill-slate-600 dark:fill-zinc-300 text-sm font-semibold">โรงอาหารและอาคารกิจกรรม</text>
                    
                    {reports.some(r => r.location === 'cafeteria' && r.status !== 'resolved') && (
                      <circle cx="370" cy="280" r="8" className="fill-orange-500 animate-ping" />
                    )}
                  </g>

                  {/* Auditorium & Library */}
                  <g 
                    className="cursor-pointer group transition-all"
                    onClick={() => {
                      setMapLocationFilter('auditorium');
                      showToast('กรองเฉพาะข้อมูล: อาคารวิทยบริการ', 'info');
                    }}
                  >
                    <path 
                      d="M 520 270 L 670 270 L 670 380 L 520 380 Z" 
                      fill={mapLocationFilter === 'auditorium' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(30, 41, 59, 0.05)'} 
                      stroke={mapLocationFilter === 'auditorium' ? '#4f46e5' : '#94a3b8'} 
                      strokeWidth={mapLocationFilter === 'auditorium' ? '3' : '1.5'}
                      className="group-hover:fill-slate-300/40 dark:group-hover:fill-zinc-800/40 transition-colors"
                    />
                    <text x="595" y="330" textAnchor="middle" className="fill-slate-500/80 dark:fill-zinc-400/50 text-xs">Library & Hall</text>
                    <text x="595" y="255" textAnchor="middle" className="fill-slate-600 dark:fill-zinc-300 text-sm font-semibold">อาคารวิทยบริการ / หอประชุม</text>
                    
                    {reports.some(r => r.location === 'auditorium' && r.status !== 'resolved') && (
                      <circle cx="595" cy="325" r="8" className="fill-red-500 animate-ping" />
                    )}
                  </g>
                </svg>

                {/* Clear Map Selection Floating Label */}
                {mapLocationFilter !== 'all' && (
                  <div className="absolute bottom-4 left-4 bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg shadow-md font-medium flex items-center gap-1">
                    แสดงพื้นที่: {LOCATION_MAP[mapLocationFilter as keyof typeof LOCATION_MAP]}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>วิกฤต (SOS)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span>เร่งด่วนสูง</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>เร่งด่วนปานกลาง</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-zinc-700"></span>ต่ำ/ปกติ</span>
            </div>
          </div>

          {/* SVG Infographics (Trending statistics) */}
          <div className="glass-panel p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                สถิติสรุปความปลอดภัย
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">แนวโน้มปัญหาประจำสัปดาห์ปัจจุบัน</p>

              {/* Custom SVG Line Chart */}
              <div className="w-full flex flex-col gap-4">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-zinc-900/60 p-4">
                  <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 block mb-2">อัตราจำแนกตามประเภทเหตุ (%)</span>
                  
                  {/* Simulated Category Bar chart with styling */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600 dark:text-zinc-300">อุบัติเหตุ / พยาบาล</span>
                        <span className="text-slate-500">40%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600 dark:text-zinc-300">อาคารและอุปกรณ์ชำรุด</span>
                        <span className="text-slate-500">30%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600 dark:text-zinc-300">ทะเลาะวิวาท / กลั่นแกล้ง</span>
                        <span className="text-slate-500">20%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600 dark:text-zinc-300">เหตุเพลิงไหม้ / ควันไฟ</span>
                        <span className="text-slate-500">10%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SVG Area chart of weekly trend */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-zinc-900/60 p-4">
                  <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 block mb-2">แนวโน้มจำนวนรายงาน (สัปดาห์นี้)</span>
                  <div className="h-[95px] w-full flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Area */}
                      <path d="M 0 50 Q 30 30 60 40 T 120 20 T 180 30 T 200 15 L 200 60 L 0 60 Z" fill="url(#chartGradient)" />
                      {/* Line */}
                      <path d="M 0 50 Q 30 30 60 40 T 120 20 T 180 30 T 200 15" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
                      {/* Dots on peak */}
                      <circle cx="120" cy="20" r="3" fill="#4f46e5" />
                      <circle cx="200" cy="15" r="3" fill="#4f46e5" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 dark:text-zinc-500 mt-2 font-medium">
                    <span>จันทร์</span>
                    <span>อังคาร</span>
                    <span>พุธ</span>
                    <span>พฤหัสบดี</span>
                    <span>ศุกร์</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 text-center dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-800/80 pt-4 mt-4">
              อัปเดตข้อมูลอัตโนมัติล่าลุดเมื่อ 1 นาทีที่แล้ว
            </div>
          </div>

        </section>

        {/* Form and Reports Panel Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: INCIDENT FORM or DIRECTORY (Grid 5/12 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Incident report form */}
            <div id="report-form" className="glass-panel p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5.5 h-5.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  ฟอร์มแจ้งรายงานเหตุไม่ปลอดภัย
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">กรอกรายละเอียดเพื่อแจ้งเจ้าหน้าที่ประจำสถานศึกษาโดยตรง</p>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    หัวข้อเหตุการณ์สำคัญ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น พบสายไฟขาดหน้าอาคารเรียน, มีคนลื่นล้มหัวแตก"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-slate-800 dark:border-slate-800 dark:bg-zinc-950 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>

                {/* Category & Urgency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      ประเภทเหตุการณ์
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as IncidentReport['category'])}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-slate-800 dark:border-slate-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    >
                      <option value="accident">🏥 อุบัติเหตุ / ปัญหาสุขภาพ</option>
                      <option value="bullying">🗣️ ทะเลาะวิวาท / บูลลี่</option>
                      <option value="disaster">🔥 อัคคีภัย / ภัยธรรมชาติ</option>
                      <option value="damage">🛠️ อาคาร / อุปกรณ์ชำรุด</option>
                      <option value="substance">⚠️ สารเสพติด / สิ่งผิดกฎหมาย</option>
                      <option value="other">📝 เรื่องอื่นๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      ระดับความเร่งด่วน
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as IncidentReport['urgency'])}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-slate-800 dark:border-slate-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                    >
                      <option value="low">ปกติ (ไม่มีความเสี่ยงต่อชีวิต)</option>
                      <option value="medium">ปานกลาง (ควรแก้ไขภายในวันนี้)</option>
                      <option value="high">สูง (ต้องการการจัดการอย่างเร็ว)</option>
                      <option value="critical">🚨 วิกฤตสูงสุด (ต้องการทีมเผชิญเหตุด่วน)</option>
                    </select>
                  </div>
                </div>

                {/* Location Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      พิกัดโซนอาคาร
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value as IncidentReport['location'])}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-slate-800 dark:border-slate-800 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    >
                      <option value="building_a">🏫 อาคารอำนวยการ</option>
                      <option value="building_b">🏫 อาคารเรียน & โรงฝึกงานช่าง (ช่างยนต์/ช่างไฟ/ช่างกล)</option>
                      <option value="digital_business">💻 อาคารเรียน เทคโนโลยีธุรกิจดิจิทัล</option>
                      <option value="accounting">📊 อาคารเรียน บัญชี</option>
                      <option value="cafeteria">🍜 โรงอาหารและอาคารกิจกรรม</option>
                      <option value="sports_complex">🏀 สนามกีฬา & ลานกิจกรรมกลางแจ้ง</option>
                      <option value="auditorium">📚 อาคารวิทยบริการ (หอประชุม/ห้องสมุด)</option>
                      <option value="other">📍 พื้นที่รอบวิทยาลัย / บ้านพักบุคลากร</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      ระบุสถานที่เฉพาะเจาะจง <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={specificLocation}
                      onChange={(e) => setSpecificLocation(e.target.value)}
                      placeholder="เช่น ห้องน้ำชายชั้น 2 ตึก A, ข้างแป้นบาสฝั่งขวา"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-slate-800 dark:border-slate-800 dark:bg-zinc-950 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    รายละเอียดรายละเอียดเหตุการณ์ <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="กรุณาอธิบายพฤติกรรม สภาพเหตุการณ์ หรือสิ่งที่เกิดขึ้นเพื่อให้เจ้าหน้าที่ประเมินและเตรียมนเครื่องมือช่วยเหลือได้เหมาะสม..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-slate-800 dark:border-slate-800 dark:bg-zinc-950 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  ></textarea>
                </div>

                {/* Anonymous Toggle Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/40">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">ต้องการส่งแบบไม่ระบุตัวตน (Anonymous)</span>
                    <span className="text-[10px] text-slate-500">ระบบจะไม่เปิดเผยข้อมูลผู้แจ้งแก่บุคคลอื่น</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAnonymous ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Reporter Contact Info (Conditioned on isAnonymous) */}
                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        ชื่อ-นามสกุล ผู้แจ้งเหตุ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={!isAnonymous}
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        placeholder="ชื่อผู้แจ้ง (ครู/บุคลากร/นักเรียน)"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-slate-800 dark:border-slate-800 dark:bg-zinc-950 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        เบอร์ติดต่อกลับสะดวก
                      </label>
                      <input
                        type="tel"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                        placeholder="เช่น 081-xxxxxxx"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-slate-800 dark:border-slate-800 dark:bg-zinc-950 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 mt-2"
                >
                  บันทึกข้อมูลและส่งรายงาน
                </button>
              </form>
            </div>

            {/* Quick Emergency Phone Directory */}
            <div className="glass-panel p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-rose-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                สายตรงเบอร์ฉุกเฉินในและนอกโรงเรียน
              </h3>
              
              <div className="space-y-2">
                <a 
                  href="tel:054252000"
                  className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 transition-colors font-medium text-xs gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-500 text-white">🚒</span>
                    <span>ศูนย์รับเรื่องฉุกเฉิน กฟผ. แม่เมาะ (EGAT)</span>
                  </div>
                  <span className="font-bold font-mono">054-252-000 ต่อ 999</span>
                </a>
                
                <a 
                  href="tel:054266174"
                  className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors font-medium text-xs gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800">🏥</span>
                    <span>ห้องพยาบาลวิทยาลัย / โรงพยาบาลแม่เมาะ</span>
                  </div>
                  <span className="font-bold font-mono">054-266-174</span>
                </a>

                <a 
                  href="tel:054266191"
                  className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors font-medium text-xs gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800">👮</span>
                    <span>สถานีตำรวจภูธรแม่เมาะ (สภ.แม่เมาะ)</span>
                  </div>
                  <span className="font-bold font-mono">054-266-191</span>
                </a>

                <a 
                  href="tel:1669"
                  className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors font-medium text-xs gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800">🚑</span>
                    <span>สายด่วนกู้ชีพเจ็บป่วยฉุกเฉินระดับชาติ</span>
                  </div>
                  <span className="font-bold font-mono">1669</span>
                </a>

                <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                      <span className="p-1.5 rounded-lg bg-emerald-500 text-white">LINE</span>
                      <span>กลุ่ม LINE ประสานงานความปลอดภัย</span>
                    </div>
                    <p className="mt-1.5 text-xs text-emerald-700/80 dark:text-emerald-200/70">
                      ใช้สำหรับเข้ากลุ่มประสานงาน แจ้งข่าว และติดตามสถานการณ์เร่งด่วนของวิทยาลัย
                    </p>
                    <a
                      href="https://line.me/ti/g/zCxh9mrKuF"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                      เปิดลิงก์กลุ่ม LINE
                    </a>
                  </div>

                  <a
                    href="https://line.me/ti/g/zCxh9mrKuF"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mx-auto sm:mx-0 flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-emerald-200 dark:bg-white"
                    aria-label="สแกน QR เพื่อเข้ากลุ่ม LINE"
                  >
                    <Image
                      src="/line-group-qr.jpg"
                      alt="QR Code กลุ่ม LINE ประสานงานความปลอดภัย"
                      width={112}
                      height={112}
                      className="h-full w-full rounded-lg object-contain"
                    />
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: INCIDENT LIST AND FILTERS (Grid 7/12 columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Feed controller and Filters */}
            <div className="glass-panel p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5.5 h-5.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    ฟีดรายงานการแจ้งเหตุในโรงเรียน
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">รายการแจ้งเตือนที่ได้รับการเก็บบันทึกข้อมูลภายในสถานศึกษา</p>
                </div>

                <div className="text-xs bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-slate-500 dark:text-zinc-300 font-semibold border border-slate-200 dark:border-slate-700">
                  กรองพบ {filteredReports.length} จากทั้งหมด {reports.length} รายการ
                </div>
              </div>

              {/* Dynamic Filter Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40">
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">ประเภท</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="accident">🏥 อุบัติเหตุ</option>
                    <option value="bullying">🗣️ ทะเลาะวิวาท</option>
                    <option value="disaster">🔥 ภัยพิบัติ</option>
                    <option value="damage">🛠️ อุปกรณ์ชำรุด</option>
                    <option value="substance">⚠️ สิ่งเสี่ยงภัย</option>
                    <option value="other">📝 อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">ความเร่งด่วน</label>
                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="low">ปกติ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">สูง</option>
                    <option value="critical">🚨 วิกฤต</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">สถานะ</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="pending">รอดำเนินการ</option>
                    <option value="investigating">กำลังตรวจ</option>
                    <option value="resolved">เสร็จสิ้น</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">กรองแผนที่</label>
                  <select
                    value={mapLocationFilter}
                    onChange={(e) => setMapLocationFilter(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none font-medium text-indigo-500"
                  >
                    <option value="all">ทุกพื้นที่วิทยาลัย</option>
                    <option value="building_a">อาคารอำนวยการ</option>
                    <option value="building_b">อาคารเรียน & โรงฝึกงานช่าง</option>
                    <option value="digital_business">เทคโนโลยีธุรกิจดิจิทัล</option>
                    <option value="accounting">บัญชี</option>
                    <option value="cafeteria">โรงอาหาร & กิจกรรม</option>
                    <option value="sports_complex">สนามกีฬา & ลานกีฬา</option>
                    <option value="auditorium">วิทยบริการ & หอประชุม</option>
                    <option value="other">โซนอื่นๆ</option>
                  </select>
                </div>

              </div>

              {/* Feed Card List */}
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                    <span className="text-4xl">📭</span>
                    <h4 className="mt-3 text-sm font-semibold text-slate-800 dark:text-zinc-200">ไม่พบบันทึกการแจ้งเหตุ</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                      ไม่พบข้อมูลรายงานที่ตรงกับการกรองปัจจุบันของคุณ หรือยังไม่มีข้อมูลแจ้งเตือน
                    </p>
                  </div>
                ) : (
                  filteredReports.map((report, index) => (
                    <div
                      key={`${report.id}-${report.timestamp.getTime()}-${index}`}
                      onClick={() => setSelectedReport(report)}
                      className={`group border rounded-2xl p-4 bg-white hover:bg-slate-50/50 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/80 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between gap-4 ${
                        selectedReport?.id === report.id 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-500' 
                          : 'border-slate-200/80 dark:border-zinc-800/80'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        {/* Tags / Header row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="font-mono font-bold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              {report.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${URGENCY_MAP[report.urgency].color}`}>
                              ด่วน: {URGENCY_MAP[report.urgency].label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${CATEGORY_MAP[report.category].color}`}>
                              {CATEGORY_MAP[report.category].label}
                            </span>
                          </div>
                          
                          <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-medium">
                            {new Date(report.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </span>
                        </div>

                        {/* Title & Location */}
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                            {report.title}
                          </h4>
                          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                            📍 {LOCATION_MAP[report.location]} ({report.specificLocation})
                          </p>
                        </div>

                        {/* Description Preview */}
                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {report.description}
                        </p>
                      </div>

                      {/* Status / Footer row */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 pt-3 mt-1">
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          ผู้ส่ง: {report.isAnonymous ? '👤 ไม่ระบุตัวตน' : `👤 ${report.reporterName}`}
                        </span>

                        <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${STATUS_MAP[report.status].color}`}>
                          {STATUS_MAP[report.status].label}
                        </span>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:flex sm:justify-between sm:items-center gap-4">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-0">
            <div className="h-6 w-6 rounded bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-md">E</div>
            <span className="text-sm font-bold text-slate-950 dark:text-white">SafeMaemoh</span>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="flex flex-wrap justify-center sm:justify-end gap-2">
              <a
                href="http://www.egtech.ac.th/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-700 dark:hover:text-indigo-300"
              >
                เว็บไซต์วิทยาลัย
              </a>
              <a
                href="https://www.facebook.com/Egtech"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:text-blue-300"
              >
                Facebook
              </a>
              <a
                href="https://linktr.ee/TeamworkDBT"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
              >
                ทีมงาน
              </a>
            </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            © {new Date().getFullYear()} EduSafe วิทยาลัยเทคนิค กฟผ. แม่เมาะ. ลิขสิทธิ์ถูกต้อง. ดูแลความปลอดภัยตลอด 24 ชั่วโมง
          </p>
          </div>
        </div>
      </footer>

      {/* DETAIL MODAL PANEL / OVERLAY */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/50 flex justify-between items-start">
              <div>
                <div className="flex flex-wrap gap-2 items-center text-xs mb-2">
                  <span className="font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {selectedReport.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${URGENCY_MAP[selectedReport.urgency].color}`}>
                    ความเร่งด่วน: {URGENCY_MAP[selectedReport.urgency].label}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${CATEGORY_MAP[selectedReport.category].color}`}>
                    {CATEGORY_MAP[selectedReport.category].label}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedReport.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-400 dark:text-zinc-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[75vh] sm:max-h-[550px] overflow-y-auto">
              
              {/* Incident Meta details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/60 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">📍 สถานที่เกิดเหตุ:</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-bold">{LOCATION_MAP[selectedReport.location]}</span>
                  <span className="text-slate-500 block">({selectedReport.specificLocation})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">👤 ผู้รายงาน:</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-bold">
                    {selectedReport.isAnonymous ? '🔒 ไม่เปิดเผยตัวตน (Anonymous)' : selectedReport.reporterName}
                  </span>
                  {!selectedReport.isAnonymous && selectedReport.reporterPhone && (
                    <span className="text-slate-500 block">📞 {selectedReport.reporterPhone}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">📅 วันเวลาที่รายงาน:</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium">
                    {new Date(selectedReport.timestamp).toLocaleDateString('th-TH')} - {new Date(selectedReport.timestamp).toLocaleTimeString('th-TH')} น.
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">🔄 สถานะความปลอดภัย:</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold inline-block mt-0.5 ${STATUS_MAP[selectedReport.status].color}`}>
                    {STATUS_MAP[selectedReport.status].label}
                  </span>
                </div>
              </div>

              {/* Core Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">รายละเอียดพฤติการณ์/เหตุฉุกเฉิน</h4>
                <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/20 text-slate-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                  {selectedReport.description}
                </div>
              </div>

              {/* Admin Work Log (Visible when there are admin notes) */}
              {(selectedReport.adminNotes || selectedReport.status !== 'pending') && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">บันทึกการสั่งการและการแก้ไข</h4>
                  <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20 text-slate-700 dark:text-zinc-300 text-xs">
                    {selectedReport.adminNotes ? (
                      <p className="font-semibold text-slate-800 dark:text-zinc-100">
                        📢 หมายเหตุฝ่ายวิกฤต: <span className="font-normal">{selectedReport.adminNotes}</span>
                      </p>
                    ) : (
                      <p className="italic text-slate-400">ยังไม่มีบันทึกข้อความเพิ่มเติมจากช่าง/ครูเวรประสานงาน</p>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive Timeline Track */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">ไทม์ไลน์การเข้าแก้ไข (Incident Timeline)</h4>
                
                <div className="relative pl-6 border-l border-slate-200 dark:border-zinc-800 ml-3 space-y-4">
                  {selectedReport.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Node dot */}
                      <span className={`absolute -left-[30px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 bg-white dark:bg-zinc-900 ${
                        step.status === 'resolved' ? 'border-emerald-500 text-emerald-500' :
                        step.status === 'investigating' ? 'border-blue-500 text-blue-500' :
                        'border-amber-500 text-amber-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          step.status === 'resolved' ? 'bg-emerald-500' :
                          step.status === 'investigating' ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`} />
                      </span>
                      <div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            {STATUS_MAP[step.status].label}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                            {new Date(step.time).toLocaleTimeString('th-TH')} น.
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{step.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Actions Panel (Conditional on isAdminMode) */}
              {isAdminMode && (
                <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-6 space-y-4">
                  <div className="bg-indigo-50/40 dark:bg-zinc-950 p-4 rounded-2xl border border-indigo-100/50 dark:border-zinc-800">
                    <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                      ⚙️ เครื่องมือสั่งการควบคุมเหตุ (สำหรับผู้ดูแลระบบ)
                    </h5>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">เพิ่มบันทึกผู้ดูแลระบบ / ข้อความสั่งการประสานงาน</label>
                        <input
                          type="text"
                          value={adminNoteInput}
                          onChange={(e) => setAdminNoteInput(e.target.value)}
                          placeholder="พิมพ์ข้อความบันทึกการแก้ไข หรือคำสั่งชี้แจง..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-zinc-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedReport.status !== 'investigating' && selectedReport.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedReport.id, 'investigating')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                          >
                            รับเรื่อง & เริ่มดำเนินการ
                          </button>
                        )}
                        
                        {selectedReport.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                          >
                            ✅ แก้ไขเรียบร้อย (ปิดเคส)
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteReport(selectedReport.id)}
                          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-semibold transition-all ml-auto"
                        >
                          🗑️ ลบรายงานนี้
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-950/60 border-t border-slate-100 dark:border-zinc-800/80 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SOS DIRECT MODAL CONFIRMATION DIALOG */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-red-500/30 animate-scaleUp">
            
            <div className="bg-red-600 text-white p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 animate-ping absolute top-4 left-4 pointer-events-none opacity-40"></div>
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold">แจ้งเตือนสถานการณ์วิกฤต (SOS)</h3>
              <p className="text-xs text-red-100 mt-1">สัญญาณเตือนจะถูกส่งไปยังห้องควบคุมและโทรศัพท์ของฝ่ายปกครองทันที</p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 text-center">กรุณาเลือกประเภทภัยวิกฤตเพื่อดำเนินการส่งพิกัดด่วน</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleTriggerSOS('อัคคีภัย / ควันไฟ')}
                  className="p-4 bg-slate-50 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🔥</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-2">อัคคีภัย / ควันไฟ</span>
                </button>

                <button
                  onClick={() => handleTriggerSOS('เหตุนักเรียนทะเลาะวิวาท')}
                  className="p-4 bg-slate-50 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">👊</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-2">ทะเลาะวิวาทรุนแรง</span>
                </button>

                <button
                  onClick={() => handleTriggerSOS('อุบัติเหตุร้ายแรงระดับวิกฤต')}
                  className="p-4 bg-slate-50 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🚑</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-2">อุบัติเหตุร้ายแรง</span>
                </button>

                <button
                  onClick={() => handleTriggerSOS('บุคคลภายนอกบุกรุกข่มขู่')}
                  className="p-4 bg-slate-50 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">👤</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-2">บุคคลภายนอกคุกคาม</span>
                </button>
              </div>

              {/* Call school number direct dial */}
              <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <a
                  href="tel:1669"
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs text-center shadow-lg transition-all"
                >
                  📞 โทรหน่วยแพทย์ฉุกเฉิน (1669)
                </a>
                <button
                  onClick={() => setShowSosModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold transition-all text-center"
                >
                  ยกเลิกส่งสัญญาณ
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function HomePage() {
  return <EduSafeDashboard />;
}


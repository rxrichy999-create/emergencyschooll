import fs from 'fs';
import path from 'path';

// Define the path to our JSON file database
const DB_PATH = path.join(process.cwd(), 'data', 'reports.json');
const NOTIFICATIONS_DB_PATH = path.join(process.cwd(), 'data', 'notifications.json');

// Interface definition matching the frontend
export interface IncidentReport {
  id: string;
  title: string;
  category: 'accident' | 'bullying' | 'disaster' | 'damage' | 'substance' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  location: 'building_a' | 'building_b' | 'cafeteria' | 'sports_complex' | 'auditorium' | 'other';
  specificLocation: string;
  description: string;
  reporterName: string;
  reporterPhone: string;
  isAnonymous: boolean;
  timestamp: string; // Stored as ISO string in JSON
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

// Initial seed data representing EGAT Mae Moh Technical College
const SEED_REPORTS: IncidentReport[] = [
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
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'investigating',
    adminNotes: 'รับแจ้งประสานงานแล้ว งานพยาบาลวิทยาลัยได้นำเปลสนามไปรับตัวนักศึกษาแล้วเพื่อตรวจดูอาการและประคบน้ำแข็ง หากจำเป็นจะประสานรถพยาบาล กฟผ. แม่เมาะ หรือกู้ภัยนำส่ง รพ.แม่เมาะ ทันที',
    timeline: [
      { status: 'pending', time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), note: 'ส่งรายงานเข้าสู่ระบบโดยครูผู้สอน' },
      { status: 'investigating', time: new Date(Date.now() - 1000 * 60 * 10).toISOString(), note: 'งานพยาบาลรับทราบเรื่อง และส่งทีมปฐมพยาบาลวิทยาลัยเข้าพื้นที่' }
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
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'resolved',
    adminNotes: 'ฝ่ายงานซ่อมบำรุงและอาคารสถานที่ได้ส่งเจ้าหน้าที่เข้าดำเนินการปิดวาล์วน้ำหลัก เปลี่ยนหัวก๊อกใหม่ และเช็ดพื้นรอบๆ ให้แห้งสนิทเรียบร้อยแล้วเพื่อความปลอดภัย',
    timeline: [
      { status: 'pending', time: new Date(Date.now() - 1000 * 60 * 120).toISOString(), note: 'นักศึกษาแจ้งรายงานเข้าระบบแบบไม่เปิดเผยตัวตน' },
      { status: 'investigating', time: new Date(Date.now() - 1000 * 60 * 95).toISOString(), note: 'หัวหน้างานอาคารสถานที่รับเรื่องและมอบหมายงานให้ทีมช่างบำรุงวิทยาลัย' },
      { status: 'resolved', time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), note: 'ช่างวิทยาลัยเข้าแก้ไขและเปลี่ยนอุปกรณ์ชิ้นใหม่สำเร็จ' }
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
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    status: 'pending',
    timeline: [
      { status: 'pending', time: new Date(Date.now() - 1000 * 60 * 300).toISOString(), note: 'รายงานบันทึกเข้าสู่ระบบโดยครูเวรวิทยบริการ' }
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
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    status: 'resolved',
    adminNotes: 'ทีมเทคนิคและไฟฟ้าวิทยาลัย ร่วมกับเจ้าหน้าที่ดับเพลิง กฟผ. แม่เมาะ ได้เข้าตรวจสอบจุดเกิดเหตุ ทำแนวกันไฟ กำจัดวัชพืชแห้งรอบรั้วสถานีทดสอบ และเปลี่ยนฟิวส์แรงสูงที่ได้รับความร้อนชำรุดเรียบร้อย ยืนยันความปลอดภัย',
    timeline: [
      { status: 'pending', time: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), note: 'ระบบตรวจพบควันไฟ ส่งสัญญาณ SOS ด่วนไปยังศูนย์ความปลอดภัย' },
      { status: 'investigating', time: new Date(Date.now() - 1000 * 60 * 1435).toISOString(), note: 'ทีมระงับอัคคีภัยแผนกช่างและหน่วยดับเพลิง กฟผ. เข้าพื้นที่คุมสถานการณ์' },
      { status: 'resolved', time: new Date(Date.now() - 1000 * 60 * 1200).toISOString(), note: 'ทำแนวกันไฟ กำจัดวัชพืชแห้ง และซ่อมบำรุงระบบจ่ายไฟเสร็จสิ้น' }
    ]
  }
];

export function readReports(): IncidentReport[] {
  try {
    // Ensure the folder exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Read or initialize JSON
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(SEED_REPORTS, null, 2), 'utf-8');
      return SEED_REPORTS;
    }

    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Database read error, falling back to mock:', error);
    return SEED_REPORTS;
  }
}

export function writeReports(reports: IncidentReport[]): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (error) {
    console.error('Database write error:', error);
  }
}

export function readNotifications(): NotificationHistoryItem[] {
  try {
    const dir = path.dirname(NOTIFICATIONS_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(NOTIFICATIONS_DB_PATH)) {
      fs.writeFileSync(NOTIFICATIONS_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }

    const content = fs.readFileSync(NOTIFICATIONS_DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Notifications read error:', error);
    return [];
  }
}

export function writeNotifications(notifications: NotificationHistoryItem[]): void {
  try {
    const dir = path.dirname(NOTIFICATIONS_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(NOTIFICATIONS_DB_PATH, JSON.stringify(notifications, null, 2), 'utf-8');
  } catch (error) {
    console.error('Notifications write error:', error);
  }
}

export function appendNotification(
  notification: Omit<NotificationHistoryItem, 'id' | 'createdAt'>
): NotificationHistoryItem {
  const notifications = readNotifications();
  const newNotification: NotificationHistoryItem = {
    ...notification,
    id: `NTF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(newNotification);
  writeNotifications(notifications.slice(0, 200));
  return newNotification;
}

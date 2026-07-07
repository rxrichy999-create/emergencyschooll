# SafeMaeMoh

ระบบรายงานเหตุและจัดการความปลอดภัยสำหรับสถานศึกษา สร้างด้วย Next.js, Supabase และระบบแจ้งเตือน LINE สำหรับเหตุ SOS/critical

## การรันโปรเจกต์

```bash
npm install
cp .env.example .env.local
npm run dev
```

เปิดเว็บที่ `http://localhost:3000`

ผู้ใช้ทั่วไปเข้าใช้งานหน้า `/` ได้เลยโดยไม่ต้อง login ส่วนหน้าผู้ดูแลระบบอยู่ที่ `/admin` และต้อง login ที่ `/admin/login`

## Environment Variables

ต้องตั้งค่าจริงใน `.env.local` ก่อนใช้งานหลังบ้าน:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_SESSION_SECRET=
AUTH_ACCOUNTS=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_TO_ID=
LINE_GROUP_ID=
```

`AUTH_ACCOUNTS` เป็น JSON array และต้องมีอย่างน้อย 1 บัญชี role `admin` เช่น:

```json
[
  {
    "username": "admin@example.com",
    "password": "change-this-password",
    "role": "admin",
    "displayName": "ผู้ดูแลระบบ"
  }
]
```

ไม่มี default password หรือ default session secret ในโค้ดแล้ว หากไม่ตั้งค่า env ระบบ admin จะไม่สามารถ login ได้

## Supabase Schema

สร้างตารางใน Supabase SQL editor:

```sql
create table if not exists reports (
  id text primary key,
  title text not null,
  category text not null,
  urgency text not null,
  location text not null,
  specific_location text not null,
  description text not null,
  reporter_name text not null,
  reporter_phone text,
  is_anonymous boolean not null default false,
  timestamp timestamptz not null,
  status text not null,
  admin_notes text,
  timeline jsonb not null default '[]'::jsonb
);

create index if not exists reports_timestamp_idx on reports (timestamp desc);
create index if not exists reports_urgency_idx on reports (urgency);
create index if not exists reports_status_idx on reports (status);

create table if not exists notifications (
  id text primary key,
  report_id text references reports(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  urgency text,
  status text,
  created_at timestamptz not null
);

create index if not exists notifications_created_at_idx on notifications (created_at desc);
```

แอปใช้ `SUPABASE_SERVICE_ROLE_KEY` เฉพาะฝั่ง server ใน API routes เท่านั้น อย่านำ key นี้ไปใช้ใน client component

## LINE Alert

เมื่อมีรายงานที่ `id` ขึ้นต้นด้วย `SOS-` หรือ `urgency` เป็น `critical` ระบบจะส่งข้อความไป LINE ผ่าน LINE Messaging API

ต้องใช้ LINE Official Account และ Messaging API:

1. เข้า LINE Developers Console
2. สร้าง Provider และ Messaging API channel หรือเปิดใช้ Messaging API ให้ LINE Official Account
3. คัดลอก Channel access token ใส่ `LINE_CHANNEL_ACCESS_TOKEN`
4. ใส่ปลายทางใน `LINE_TO_ID` หรือ `LINE_GROUP_ID`
   - userId สำหรับส่งหาแอดมิน 1 คน
   - groupId สำหรับส่งเข้ากลุ่ม
   - roomId สำหรับส่งเข้าห้องแชทหลายคน

หมายเหตุ: ถ้าจะส่งเข้ากลุ่ม ต้องเชิญ LINE Official Account เข้ากลุ่มก่อน และต้องมี `groupId` ของกลุ่มนั้น

## Commands

```bash
npm run lint
npm run build
```

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = searchParams.get('next') || '/admin';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      window.location.href = nextPath.startsWith('/admin') ? nextPath : '/admin';
      return;
    }

    setError('บัญชีนี้ไม่ใช่แอดมิน หรือชื่อผู้ใช้/รหัสผ่านไม่ถูกต้อง');
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d1c] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(190,24,93,0.17),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(30,64,175,0.14),_transparent_36%)]" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8"
      >
        <div className="mb-7 border-b border-white/10 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">SafeMaeMoh Admin</p>
          <h1 className="mt-2 text-2xl font-bold">เข้าสู่ระบบผู้ดูแล</h1>
          <p className="mt-2 text-sm text-slate-300">หน้านี้สำหรับแอดมินที่ได้รับอนุญาตเท่านั้น</p>
        </div>

        <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="username">
          ชื่อผู้ใช้แอดมิน
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="mb-5 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10"
          autoComplete="username"
          placeholder="admin"
        />

        <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="password">
          รหัสผ่าน
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10"
            autoComplete="current-password"
            autoFocus
            placeholder="กรอกรหัสผ่าน"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            {showPassword ? (
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.6 4.4 9.6 6.1a1.8 1.8 0 0 1 0 1.8 18.4 18.4 0 0 1-3.1 3.8M6.2 6.2A18.5 18.5 0 0 0 2.4 10a1.8 1.8 0 0 0 0 2c1 1.6 4.4 6 9.6 6 1 0 1.9-.2 2.8-.5" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.4 10.1a1.8 1.8 0 0 0 0 1.8C3.4 13.6 6.8 18 12 18s8.6-4.4 9.6-6.1a1.8 1.8 0 0 0 0-1.8C20.6 8.4 17.2 4 12 4S3.4 8.4 2.4 10.1Z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
            )}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่หน้าผู้ดูแล'}
        </button>

        <Link href="/" className="mt-5 block text-center text-xs font-semibold text-slate-400 transition hover:text-white">
          กลับไปหน้าผู้ใช้ทั่วไป
        </Link>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

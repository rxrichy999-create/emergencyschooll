'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur"
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">SafeMaeMoh Admin</p>
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
          className="mb-4 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-rose-400"
          autoComplete="username"
        />

        <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="password">
          รหัสผ่าน
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-rose-400"
          autoComplete="current-password"
          autoFocus
        />

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่หน้าผู้ดูแล'}
        </button>

        <Link href="/" className="mt-4 block text-center text-xs font-semibold text-slate-400 hover:text-white">
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

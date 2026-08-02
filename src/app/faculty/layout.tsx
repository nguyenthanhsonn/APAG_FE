'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, X } from 'lucide-react';
import { Header } from '@/components/Layout/Header';

const menuItems = [
  { path: '/faculty', icon: Building2, label: 'Duyệt điểm rèn luyện' },
];

function FacultySidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        aria-label="Đóng menu"
        className={`fixed inset-0 z-40 cursor-pointer bg-black/50 backdrop-blur-[2px] lg:hidden transition-all duration-300 ease-in-out ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-brand-secondary shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="relative flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg">
              <Image src="/apag-logo.png" alt="APAG Logo" width={38} height={38} className="object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-tight text-white">Khoa</p>
              <p className="truncate text-[10px] font-medium text-white/70">CSMTS</p>
            </div>
          </div>
          <button type="button" aria-label="Đóng menu" onClick={onClose} className="cursor-pointer p-1 text-white/70 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[11px] font-semibold text-white/80">Tài khoản khoa</p>
          <p className="break-words text-[10px] text-white/55">Dữ liệu theo phiên đăng nhập</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-white/55">KHOA</p>
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
                  className={`group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? 'bg-brand-primary text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon size={17} className={`shrink-0 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                  <span className="whitespace-normal break-words leading-tight flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F8F9FA] text-[#1A1B1E] overflow-hidden">
      <FacultySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col h-full lg:pl-[220px]">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 flex flex-col bg-[#F8F9FA] overflow-x-hidden max-w-full overflow-y-auto min-h-0">
          {children}
        </main>

        <footer className="shrink-0 border-t border-[#E9ECEF] bg-white px-6 py-3 lg:pl-0">
          <p className="text-center text-[11px] text-[#ADB5BD]">
            © 2024 Hệ thống Đánh giá Rèn luyện Sinh viên — CSMTS
          </p>
        </footer>
      </div>
    </div>
  );
}

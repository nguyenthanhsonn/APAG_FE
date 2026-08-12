'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { MainLayoutProps } from '@/types/common';

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F8F9FA] text-[#1A1B1E] overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col h-full lg:pl-[220px]">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex flex-col bg-[#F8F9FA] overflow-x-hidden max-w-full overflow-y-auto min-h-0">
          {children}
        </main>
        {/* Minimal footer */}
        <footer className="shrink-0 border-t border-[#E9ECEF] bg-white px-6 py-3 lg:pl-0">
          <p className="text-center text-[11px] text-[#ADB5BD]">
            © Phân hiệu Học viện Hành chính và Quản trị công tại thành phố Đà Nẵng — APAG
          </p>
        </footer>
      </div>
    </div>
  );
};

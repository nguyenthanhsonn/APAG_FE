'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  History,
  Award,
  Users,
  Building2,
  GraduationCap,
  X,
  Compass,
  CalendarDays,
  ClipboardCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { SidebarProps } from '@/types/common';

const studentMenuItems = [
  { path: '/student/evaluation', icon: FileText, label: 'Phiếu đánh giá' },
  { path: '/student/history', icon: History, label: 'Lịch sử đánh giá' },
  { path: '/student/results', icon: Award, label: 'Kết quả' },
];

const adminMenuItems = [
  { path: '/admin', icon: Home, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Quản lý người dùng' },
  { path: '/admin/students', icon: GraduationCap, label: 'Quản lý sinh viên' },
  { path: '/admin/faculties', icon: Building2, label: 'Quản lý Khoa' },
  { path: '/admin/majors', icon: Compass, label: 'Quản lý Ngành' },
  { path: '/admin/classes', icon: GraduationCap, label: 'Quản lý Lớp' },
  { path: '/admin/semesters', icon: CalendarDays, label: 'Quản lý Học kỳ' },
  { path: '/admin/evaluations', icon: ClipboardCheck, label: 'Duyệt đánh giá rèn luyện' },
];

const advisorMenuItems = [
  { path: '/advisor', icon: Users, label: 'Lớp phụ trách' },
];

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const menuItems = user?.role === 'admin'
    ? adminMenuItems
    : user?.role === 'advisor'
    ? advisorMenuItems
    : studentMenuItems;
  const sectionLabel = user?.role === 'admin'
    ? 'QUẢN TRỊ'
    : user?.role === 'advisor'
    ? 'CỐ VẤN HỌC TẬP'
    : 'SINH VIÊN';
  const homePath = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'advisor'
    ? '/advisor'
    : '/student';

  return (
    <>
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Đóng menu"
        className={`fixed inset-0 z-40 cursor-pointer bg-black/50 backdrop-blur-[2px] lg:hidden transition-all duration-300 ease-in-out ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-brand-secondary shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo header */}
        <div className="relative flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link
            href={homePath}
            className="flex min-w-0 cursor-pointer items-center gap-2.5"
            onClick={onClose}
          >
            {/* Logo mark */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg">
              <Image src="/apag-logo.png" alt="APAG Logo" width={38} height={38} className="object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-tight text-white">Đánh giá Rèn luyện</p>
              <p className="text-[10px] font-medium text-white/70">CSMTS</p>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={onClose}
            className="ui-icon-button cursor-pointer text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Section label */}
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-white/55">
            {sectionLabel}
          </p>

          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
                  className={`group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 transition-transform duration-150 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
                      }`}
                  />
                  <span className="whitespace-normal break-words leading-tight flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

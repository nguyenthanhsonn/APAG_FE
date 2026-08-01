'use client';

import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface RoleCard {
  role: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  cardColor: string;
}

const ROLES: RoleCard[] = [
  {
    role: 'student',
    label: 'Sinh viên',
    description: 'Tự chấm điểm rèn luyện & nộp phiếu đánh giá cho kỳ học.',
    href: '/login',
    icon: GraduationCap,
    badge: 'Đăng nhập thật',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cardColor: 'hover:border-emerald-400',
  },
  {
    role: 'class_council',
    label: 'Cố vấn học tập (CVHT)',
    description: 'Xem phiếu điểm toàn lớp, chốt điểm hoặc trả phiếu về cho sinh viên.',
    href: '/login',
    icon: UserCheck,
    badge: 'Đăng nhập thật',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    cardColor: 'hover:border-blue-400',
  },
  {
    role: 'class_leader',
    label: 'Lớp trưởng (Class Leader)',
    description: 'Quản lý, tổng hợp và theo dõi đánh giá rèn luyện cấp lớp.',
    href: '/login',
    icon: UserCheck,
    badge: 'Đăng nhập thật',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    cardColor: 'hover:border-amber-400',
  },
  {
    role: 'faculty',
    label: 'Ban/Khoa (Faculty)',
    description: 'Xem báo cáo, xét duyệt và quản lý rèn luyện sinh viên theo Khoa.',
    href: '/login',
    icon: ShieldCheck,
    badge: 'Đăng nhập thật',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    cardColor: 'hover:border-teal-400',
  },
  {
    role: 'training_department',
    label: 'Phòng Đào Tạo (Training Department)',
    description: 'Thống kê tổng hợp, kiểm tra và phê duyệt kết quả rèn luyện cấp Trường.',
    href: '/login',
    icon: ShieldCheck,
    badge: 'Đăng nhập thật',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cardColor: 'hover:border-indigo-400',
  },
  {
    role: 'admin',
    label: 'Quản trị viên',
    description: 'Quản lý người dùng, sinh viên, khoa, ngành, lớp, học kỳ và duyệt toàn bộ.',
    href: '/login',
    icon: ShieldCheck,
    badge: 'Đăng nhập thật',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    cardColor: 'hover:border-purple-400',
  },
];

export default function RoleSwitcherPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#104E92] rounded-2xl mb-4 shadow-lg">
            <span className="text-xl font-black text-white">RL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1A1B1E]">Chọn vai trò</h1>
          <p className="mt-2 text-[#868E96] text-base font-medium">
            Hệ thống Đánh giá Rèn luyện Sinh viên — CSMTS
          </p>
        </div>

        {/* Role Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.role}
                href={r.href}
                className={`group flex flex-col gap-3 rounded-2xl border-2 border-[#E9ECEF] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${r.cardColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF2FF] text-[#3B5BDB]">
                    <Icon size={22} />
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${r.badgeColor}`}>
                    {r.badge}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1A1B1E] group-hover:text-[#3B5BDB] transition-colors">
                    {r.label}
                  </h2>
                  <p className="mt-1 text-sm text-[#868E96] leading-relaxed">{r.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#3B5BDB]">
                  Đăng nhập
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-[#ADB5BD]">
          © 2024 CSMTS — Chỉ dùng nội bộ
        </p>
      </div>
    </div>
  );
}

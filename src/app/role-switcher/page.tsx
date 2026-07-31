'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Users,
  Building2,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  FlaskConical,
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
  isMock: boolean;
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
    isMock: false,
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
    isMock: false,
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
    isMock: false,
  },
  {
    role: 'class_leader',
    label: 'Lớp trưởng',
    description: 'Xác nhận họp lớp cho danh sách sinh viên đã nộp phiếu. Có nút in danh sách.',
    href: '/class_leader',
    icon: Users,
    badge: 'MOCK / Demo',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    cardColor: 'hover:border-amber-400',
    isMock: true,
  },
  {
    role: 'faculty',
    label: 'Khoa',
    description: 'Duyệt điểm rèn luyện lần cuối cho toàn bộ các lớp thuộc khoa.',
    href: '/faculty',
    icon: Building2,
    badge: 'MOCK / Demo',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    cardColor: 'hover:border-amber-400',
    isMock: true,
  },
  {
    role: 'training_department',
    label: 'Phòng Đào tạo',
    description: 'Xem báo cáo & thống kê toàn trường. Không thực hiện duyệt — chỉ đọc.',
    href: '/training_department',
    icon: BarChart3,
    badge: 'MOCK / Demo',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    cardColor: 'hover:border-amber-400',
    isMock: true,
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

        {/* Mock badge info */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-8">
          <FlaskConical size={18} className="shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-700">
            Các role <strong>MOCK / Demo</strong> có thể truy cập trực tiếp không cần đăng nhập, dùng để demo UI cho stakeholder.
            Các role còn lại yêu cầu đăng nhập thật.
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
                  {r.isMock ? 'Xem Demo' : 'Đăng nhập'}
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

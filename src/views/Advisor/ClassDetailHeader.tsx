'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, Send } from 'lucide-react';

export interface ClassDetailHeaderProps {
  classCode: string;
  className: string;
  majorName?: string;
  facultyName?: string;
  enrollmentYear?: string | number;
  totalStudents: number;
  hasNotSubmitted: boolean;
  submitting?: boolean;
  sendLabel?: string;
  onSendToAdmin?: () => void;
  hideBreadcrumb?: boolean;
}

export function ClassDetailHeader({
  classCode,
  className,
  majorName,
  facultyName,
  enrollmentYear,
  totalStudents,
  hasNotSubmitted,
  submitting = false,
  sendLabel = 'Phê duyệt',
  onSendToAdmin,
  hideBreadcrumb = false,
}: ClassDetailHeaderProps) {
  const displayTitle =
    className && className !== classCode
      ? `Lớp ${classCode} — ${className}`
      : `Lớp ${classCode}`;

  const metadataItems = [
    majorName ? `Ngành: ${majorName}` : null,
    facultyName ? `Khoa: ${facultyName}` : null,
    enrollmentYear ? `Năm nhập học: ${enrollmentYear}` : null,
  ].filter(Boolean);

  const subtitle =
    metadataItems.length > 0
      ? metadataItems.join(' • ')
      : 'Danh sách sinh viên và trạng thái nộp phiếu đánh giá rèn luyện.';

  return (
    <header className="space-y-3">
      {/* Breadcrumb Navigation */}
      {!hideBreadcrumb && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Link
            href="/advisor"
            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={14} />
            Danh sách lớp
          </Link>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="font-semibold text-gray-800">{classCode}</span>
        </nav>
      )}

      {/* Main Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            {displayTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onSendToAdmin}
          disabled={submitting || hasNotSubmitted || totalStudents === 0}
          title={
            totalStudents === 0
              ? 'Lớp chưa có sinh viên nào.'
              : hasNotSubmitted
                ? 'Còn sinh viên chưa nộp phiếu đánh giá.'
                : sendLabel
          }
          aria-label="Phê duyệt"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={16} />
          {submitting ? 'Đang gửi...' : sendLabel}
        </button>
      </div>
    </header>
  );
}

export default ClassDetailHeader;

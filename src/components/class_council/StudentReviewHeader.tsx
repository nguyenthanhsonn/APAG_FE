'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface StudentReviewHeaderProps {
  classId: string;
  studentName: string;
  studentCode: string;
  rawStudentId?: string;
}

function getInitials(name: string): string {
  if (!name) return 'SV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isValidStudentCode(code?: string, rawId?: string) {
  if (!code || code === '-' || code === rawId) return false;
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(code)) return false;
  return true;
}

export function StudentReviewHeader({
  classId,
  studentName,
  studentCode,
  rawStudentId,
}: StudentReviewHeaderProps) {
  const initials = getInitials(studentName);
  const showCode = isValidStudentCode(studentCode, rawStudentId);

  return (
    <header className="space-y-4">
      {/* Breadcrumb / Back button */}
      <nav aria-label="Breadcrumb">
        <Link
          href={`/advisor/${classId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Quay lại danh sách sinh viên
        </Link>
      </nav>

      {/* Main Header Container */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Student Identity Block */}
        <div className="flex items-center gap-3.5" data-student-id={rawStudentId}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-base border border-indigo-200 shadow-2xs select-none">
            {initials}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              {studentName}
            </h1>
            {showCode && (
              <p className="mt-0.5 text-xs font-medium text-gray-500">
                Mã SV: <span className="font-semibold text-gray-700">{studentCode}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default StudentReviewHeader;

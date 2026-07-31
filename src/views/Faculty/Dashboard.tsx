'use client';

import { Building2 } from 'lucide-react';

export function FacultyDashboard() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="ui-page-title">Duyệt điểm rèn luyện</h1>
        <p className="mt-1 text-sm text-[#868E96]">
          Chưa có dữ liệu từ API cho màn hình này.
        </p>
      </div>

      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-[#DEE2E6] bg-white px-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDF2FF] text-[#3B5BDB]">
          <Building2 size={24} />
        </div>
        <h2 className="text-base font-bold text-[#1A1B1E]">Không có dữ liệu khoa</h2>
        <p className="mt-1 max-w-md text-sm text-[#868E96]">
          Khi BE cung cấp API cho khoa, màn hình này sẽ hiển thị dữ liệu thật từ hệ thống.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, School } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ClassCard, { type CouncilClass } from '@/components/class_council/ClassCard';
import { useAuthStore } from '@/store/authStore';

export function ClassListView() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const syncProfile = async () => {
      try {
        setLoadingProfile(true);
        await refreshProfile();
      } catch {
        // Giữ trang ổn định nếu phiên đăng nhập hết hạn hoặc profile tạm thời chưa lấy được.
      } finally {
        setLoadingProfile(false);
      }
    };

    syncProfile();
  }, [refreshProfile]);

  const classes = useMemo<CouncilClass[]>(() => {
    const managedClasses = user?.managedClasses ?? [];

    return managedClasses
      .map((item) => ({
        id: item.classId || item.id || '',
        name: item.className || item.name || item.classCode || item.code || 'Lớp phụ trách',
        studentCount: item.studentCount ?? 0,
        facultyName: item.faculty?.name || item.facultyName || '',
        academicYear: item.enrollmentYear ? `Khóa ${item.enrollmentYear}` : '',
      }))
      .filter((item) => item.id);
  }, [user?.managedClasses]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="ui-page-title">Duyệt điểm rèn luyện</h1>
        <p className="mt-1 text-sm text-[#868E96]">Danh sách lớp đang phụ trách.</p>
      </div>

      {loadingProfile ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-2.5 rounded-xl border border-[#E9ECEF] bg-white p-6 shadow-sm">
          <Loader2 className="animate-spin text-brand-primary" size={34} />
          <p className="text-sm font-semibold text-[#868E96]">Đang tải danh sách lớp phụ trách...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-[#DEE2E6] bg-white p-6 text-center">
          <School size={38} className="text-[#ADB5BD]" />
          <h2 className="mt-3 text-base font-bold text-[#1A1B1E]">Chưa được phân công lớp</h2>
          <p className="mt-1 max-w-md text-sm text-[#868E96]">Khi được phân công làm cố vấn lớp, danh sách lớp sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              onOpen={(classId) => router.push(`/class_council/${classId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

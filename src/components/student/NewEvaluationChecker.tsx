'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_Student } from '@/api/API_Student';
import { useAuthStore } from '@/store/authStore';
import { NewEvaluationPopup } from '@/components/student/NewEvaluationPopup';
import type { NewEvaluationPopupInfo } from '@/components/student/NewEvaluationPopup';
import { hasAccessToken } from '@/utils/authToken';

const SESSION_KEY = 'csmts_eval_popup_seen';

export function NewEvaluationChecker() {
  const router = useRouter();
  const [popupInfo, setPopupInfo] = useState<NewEvaluationPopupInfo | null>(null);
  const { isHydrated, isAuthenticated, user } = useAuthStore();

  const checkForNewEvaluation = useCallback(async () => {
    // Chỉ hiện 1 lần mỗi phiên (sessionStorage reset khi đóng tab / đăng nhập mới)
    if (sessionStorage.getItem(SESSION_KEY)) return;

    try {
      const res = await API_Student.getNotifications({ page: 1, limit: 20 });
      const items = (res?.items ?? (res as any)?.data?.items ?? []).filter((item: any) => !item.isRead);

      // Tìm thông báo liên quan đến đánh giá mới (type hoặc title chứa từ khoá)
      const evalNotif = items.find(
        (n: any) =>
          n.type === 'NEW_EVALUATION' ||
          n.type === 'new_evaluation' ||
          /đánh giá|phiếu|kết quả rèn luyện/i.test(n.title + ' ' + n.content),
      );

      if (!evalNotif) return;

      // Trích xuất semesterName và deadline từ title/content
      const semesterMatch = (evalNotif.title + ' ' + evalNotif.content).match(
        /học kỳ[^\n,;.!?]*/i,
      );
      const deadlineMatch = (evalNotif.title + ' ' + evalNotif.content).match(
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/,
      );

      setPopupInfo({
        semesterName: semesterMatch?.[0]?.trim() || evalNotif.title || 'Đợt đánh giá mới',
        deadline: deadlineMatch?.[0] ?? undefined,
        notificationId: evalNotif.id,
      });
    } catch {
      // Không làm gián đoạn UX nếu API lỗi
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || user?.role !== 'student') return;
    if (!hasAccessToken()) return;

    checkForNewEvaluation();
  }, [isHydrated, isAuthenticated, user?.role, checkForNewEvaluation]);

  const handleClose = () => {
    // Đánh dấu đã xem trong phiên này
    sessionStorage.setItem(SESSION_KEY, '1');
    setPopupInfo(null);
  };

  const handleViewDetail = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setPopupInfo(null);
    router.push('/student/evaluation');
  };

  if (!popupInfo) return null;

  return (
    <NewEvaluationPopup
      evaluationInfo={popupInfo}
      onClose={handleClose}
      onViewDetail={handleViewDetail}
    />
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_Student } from '@/api/API_Student';
import { useAuthStore } from '@/store/authStore';
import { NewEvaluationPopup } from '@/components/student/NewEvaluationPopup';
import type { NewEvaluationPopupInfo } from '@/components/student/NewEvaluationPopup';
import { hasAccessToken } from '@/utils/authToken';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';

const SESSION_KEY_PREFIX = 'csmts_eval_popup_seen_';

export function NewEvaluationChecker() {
  const router = useRouter();
  const [popupInfo, setPopupInfo] = useState<NewEvaluationPopupInfo | null>(null);
  const { isHydrated, isAuthenticated, user } = useAuthStore();

  const checkForNewEvaluation = useCallback(async () => {
    if (!hasAccessToken()) return;

    try {
      const res = await API_Student.getNotifications({ page: 1, limit: 10 });
      const items = Array.isArray((res as any)?.items)
        ? (res as any).items
        : Array.isArray((res as any)?.data?.items)
        ? (res as any).data.items
        : Array.isArray(res)
        ? res
        : [];

      // QUAN TRỌNG: dùng .find() theo điều kiện, KHÔNG lấy items[0] —
      // vì có thể có notification khác mới hơn chen vào giữa items.
      const evalNotif = items.find(
        (n: any) => n.type === 'NEW_EVALUATION_PERIOD' && n.isRead === false,
      );
      if (!evalNotif) return;

      // QUAN TRỌNG: chặn hiện popup lặp lại trong cùng 1 phiên nếu
      // notifications:refresh bắn nhiều lần. Track theo notificationId cụ thể.
      const seenKey = SESSION_KEY_PREFIX + evalNotif.id;
      if (sessionStorage.getItem(seenKey)) return;

      setPopupInfo({
        title: evalNotif.title,
        content: evalNotif.content,
        notificationId: evalNotif.id,
      });
    } catch (err) {
      console.error('Error checking for new evaluation:', err);
    }
  }, []);

  // Lắng nghe socket realtime khi admin mở học kỳ
  useNotificationSocket(checkForNewEvaluation);

  // Check 1 lần khi component mount (dành cho trường hợp SV đăng nhập sau khi học kỳ đã mở)
  useEffect(() => {
    if (!isHydrated || !isAuthenticated || user?.role !== 'student') return;
    if (!hasAccessToken()) return;

    checkForNewEvaluation();
  }, [isHydrated, isAuthenticated, user?.role, checkForNewEvaluation]);

  const handleAcknowledge = async (redirectToEvaluation: boolean) => {
    if (!popupInfo?.notificationId) {
      setPopupInfo(null);
      if (redirectToEvaluation) {
        router.push('/student/evaluation');
      }
      return;
    }

    const notifId = popupInfo.notificationId;
    sessionStorage.setItem(SESSION_KEY_PREFIX + notifId, '1');
    setPopupInfo(null);

    try {
      await API_Student.markAsRead(notifId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    if (redirectToEvaluation) {
      router.push('/student/evaluation');
    }
  };

  if (!popupInfo) return null;

  return (
    <NewEvaluationPopup
      evaluationInfo={popupInfo}
      onClose={() => handleAcknowledge(false)}
      onViewDetail={() => handleAcknowledge(true)}
    />
  );
}

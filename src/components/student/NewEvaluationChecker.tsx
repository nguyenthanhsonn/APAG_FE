'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const acknowledgingRef = useRef(false);
  const { isHydrated, isAuthenticated, user } = useAuthStore();

  const checkForNewEvaluation = useCallback(async () => {
    if (!hasAccessToken()) return;

    try {
      const popup = await API_Student.getEvaluationPopup();
      if (!popup.visible || !popup.semesterId) {
        setPopupInfo(null);
        return;
      }

      const seenKey = SESSION_KEY_PREFIX + popup.semesterId;
      if (sessionStorage.getItem(seenKey)) return;

      setPopupInfo({
        title: popup.title || undefined,
        content: popup.content || undefined,
        semesterId: popup.semesterId,
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

  useEffect(() => {
    if (popupInfo) {
      acknowledgingRef.current = false;
    }
  }, [popupInfo]);

  const handleAcknowledge = (redirectToEvaluation: boolean) => {
    if (acknowledgingRef.current) return;
    acknowledgingRef.current = true;

    if (popupInfo?.semesterId) {
      sessionStorage.setItem(SESSION_KEY_PREFIX + popupInfo.semesterId, '1');
    }

    setPopupInfo(null);

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

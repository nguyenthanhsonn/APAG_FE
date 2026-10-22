"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { subscribeNotifications } from "@/realtime/notification-client";
export { getSocketBaseUrl } from "@/realtime/notification-client";

export function useNotificationSocket(
  onRefresh?: (data?: any) => void | Promise<void>,
) {
  const userId = useAuthStore((state) => state.user?.id);
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);
  useEffect(() => {
    if (!userId) return;
    return subscribeNotifications(userId, (data) =>
      onRefreshRef.current?.(data),
    );
  }, [userId]);
}

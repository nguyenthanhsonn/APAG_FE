'use client';

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { hasAccessToken } from '@/utils/authToken';
import { API_URL } from '@/api/api';

let sharedSocket: Socket | null = null;
let refCount = 0;
let isInitializing = false;
const pendingCallbacks: Array<(socket: Socket) => void> = [];

export const getSocketBaseUrl = () => {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configured) return configured.replace(/\/$/, '');

  if (API_URL.startsWith('http')) {
    return API_URL.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
  }

  if (typeof window === 'undefined') return '';

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:5050`;
  }

  return window.location.origin;
};

export function useNotificationSocket(onRefresh?: (data?: any) => void) {
  const { user } = useAuthStore();
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!user?.id || !hasAccessToken()) return;

    const userId = user.id;
    let mounted = true;
    refCount++;

    const handleRefresh = (data?: any) => {
      onRefreshRef.current?.(data);
    };

    const attachListeners = (socket: Socket) => {
      if (!mounted) return;

      socket.off('notifications:refresh', handleRefresh);
      socket.off('notifications:new', handleRefresh);
      socket.on('notifications:refresh', handleRefresh);
      socket.on('notifications:new', handleRefresh);

      if (socket.connected) {
        socket.emit('notifications:join', { userId });
      }
    };

    if (sharedSocket) {
      attachListeners(sharedSocket);
    } else {
      pendingCallbacks.push(attachListeners);

      if (!isInitializing) {
        isInitializing = true;
        import('socket.io-client')
          .then(({ io }) => {
            if (refCount > 0 && !sharedSocket) {
              const socket = io(`${getSocketBaseUrl()}/notifications`, {
                withCredentials: true,
              });

              sharedSocket = socket;

              socket.on('connect', () => {
                socket.emit('notifications:join', { userId });
              });

              socket.on('notifications:error', (err) => {
                console.error('Notification socket error:', err);
              });

              const callbacks = [...pendingCallbacks];
              pendingCallbacks.length = 0;
              callbacks.forEach((cb) => cb(socket));
            } else {
              pendingCallbacks.length = 0;
            }
            isInitializing = false;
          })
          .catch((err) => {
            console.error('Failed to initialize notification socket:', err);
            isInitializing = false;
            pendingCallbacks.length = 0;
          });
      }
    }

    return () => {
      mounted = false;
      if (sharedSocket) {
        sharedSocket.off('notifications:refresh', handleRefresh);
        sharedSocket.off('notifications:new', handleRefresh);
      }

      refCount--;
      if (refCount <= 0) {
        if (sharedSocket) {
          sharedSocket.disconnect();
          sharedSocket = null;
        }
        refCount = 0;
        isInitializing = false;
        pendingCallbacks.length = 0;
      }
    };
  }, [user?.id]);
}

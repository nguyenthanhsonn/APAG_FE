"use client";

import { API_URL } from "../api/api";
import { API_Auth } from "../api/API_Auth";
import { AUTH_SESSION_EVENT, isAuthSessionEnding } from "../utils/authSession";
import {
  NotificationConnection,
  type SocketSession,
} from "./notification-connection";

export function getSocketBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configured)
    return configured.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");
  if (API_URL.startsWith("http"))
    return API_URL.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");
  if (typeof window === "undefined") return "";
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:5050`;
  }
  return window.location.origin;
}

function session(): SocketSession | null {
  if (typeof window === "undefined" || isAuthSessionEnding()) return null;
  try {
    const token = localStorage.getItem("accessToken");
    const user = JSON.parse(localStorage.getItem("user") || "null") as {
      id?: string;
    } | null;
    if (!token || !user?.id) return null;
    // This is a local account-switch fence, NOT JWT verification (the server verifies).
    const part = token.split(".")[1];
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized)) as { sub?: string };
    return claims.sub === user.id ? { userId: user.id, token } : null;
  } catch {
    return null;
  }
}

const connection = new NotificationConnection({
  load: async () => (await import("socket.io-client")).io,
  url: getSocketBaseUrl,
  session,
  recover: () => API_Auth.getMe(),
});
let subscriptions = 0;
function authChanged(event: Event) {
  if ((event as CustomEvent<string>).detail === "ending") connection.suspend();
  else connection.sessionChanged();
}
function storageChanged(event: StorageEvent) {
  if (
    event.key === null ||
    ["user", "accessToken", "refreshToken"].includes(event.key)
  )
    connection.sessionChanged();
}

export function subscribeNotifications(
  userId: string,
  callback: (data?: any) => void | Promise<void>,
) {
  if (typeof window === "undefined") return () => undefined;
  if (subscriptions++ === 0) {
    // A login may have completed while no notification component was mounted.
    if (!isAuthSessionEnding()) connection.sessionChanged();
    window.addEventListener(AUTH_SESSION_EVENT, authChanged);
    window.addEventListener("storage", storageChanged);
  }
  const release = connection.subscribe(userId, callback);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    release();
    if (--subscriptions === 0) {
      window.removeEventListener(AUTH_SESSION_EVENT, authChanged);
      window.removeEventListener("storage", storageChanged);
    }
  };
}

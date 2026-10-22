export const AUTH_SESSION_EVENT = "apag:auth-session";
let ending = false;
export const isAuthSessionEnding = () => ending;

export function notifyAuthSession(phase: "changed" | "ending" = "changed") {
  ending = phase === "ending";
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(AUTH_SESSION_EVENT, { detail: phase }),
    );
  }
}

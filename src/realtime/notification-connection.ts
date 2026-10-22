import type { Socket } from "socket.io-client";

export type SocketSession = { userId: string; token: string };
type Listener = (data?: any) => void | Promise<void>;
type SocketFactory = (
  url: string,
  options: Parameters<typeof import("socket.io-client").io>[1],
) => Socket;
type Dependencies = {
  load: () => Promise<SocketFactory>;
  url: () => string;
  session: () => SocketSession | null;
  recover: () => Promise<unknown>;
  schedule?: (
    callback: () => void,
    delay: number,
  ) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout>) => void;
};

// One owner for connection lifecycle; React components only hold independent subscriptions.
export class NotificationConnection {
  private readonly listeners = new Map<
    symbol,
    { userId: string; notify: Listener }
  >();
  private socket: Socket | null = null;
  private identity: SocketSession | null = null;
  private generation = 0;
  private loading = false;
  private recovering = false;
  private suspended = false;
  private recoveredToken: string | null = null;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private attempts = 0;

  constructor(private readonly deps: Dependencies) {}

  subscribe(userId: string, notify: Listener) {
    const id = Symbol();
    this.listeners.set(id, { userId, notify });
    this.sync();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.listeners.delete(id);
      this.sync();
    };
  }

  sessionChanged() {
    this.suspended = false;
    this.sync();
  }
  // Call BEFORE awaiting HTTP logout; no refresh/reconnect may outlive that intent.
  suspend() {
    this.suspended = true;
    this.dispose();
  }

  private wanted(): SocketSession | null {
    if (this.suspended) return null;
    const session = this.deps.session();
    return session &&
      [...this.listeners.values()].some(
        (item) => item.userId === session.userId,
      )
      ? session
      : null;
  }

  private sync() {
    const session = this.wanted();
    if (!session) {
      this.dispose();
      return;
    }
    if (
      this.identity?.userId !== session.userId ||
      this.identity.token !== session.token
    ) {
      this.dispose();
      this.identity = session;
    }
    if (!this.socket && !this.loading && this.retry === undefined)
      void this.start(this.generation);
  }

  private current(generation: number) {
    const session = this.wanted();
    return (
      generation === this.generation &&
      !!session &&
      session.userId === this.identity?.userId &&
      session.token === this.identity.token
    );
  }

  private async start(generation: number) {
    this.loading = true;
    try {
      const io = await this.deps.load();
      // Import completion from a previous mount/session must never create a socket.
      if (!this.current(generation)) return;
      const socket = io(`${this.deps.url()}/notifications`, {
        autoConnect: false,
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5,
        auth: (done) => {
          const session = this.wanted();
          done({
            token: this.current(generation) ? session?.token : undefined,
          });
        },
      });
      this.socket = socket;
      socket.on("connect", () => {
        if (!this.current(generation)) {
          socket.disconnect();
          return;
        }
        this.attempts = 0;
        // Reload durable notifications after a reconnect; Pub/Sub has no replay.
        this.notify(generation);
      });
      socket.on("notifications:new", (data) => this.notify(generation, data));
      socket.on("notifications:refresh", () => this.notify(generation));
      socket.on("disconnect", (reason) => {
        if (reason === "io server disconnect") void this.recover(generation);
      });
      socket.on(
        "connect_error",
        (error: Error & { data?: { status?: number } }) => {
          if (error.data?.status === 401) void this.recover(generation);
          // Transport failures use Socket.IO's bounded exponential backoff.
        },
      );
      socket.connect();
    } catch {
      if (this.current(generation))
        this.later(generation, () => void this.start(generation));
    } finally {
      if (generation === this.generation) this.loading = false;
    }
  }

  private notify(generation: number, data?: any) {
    if (!this.current(generation)) return;
    for (const listener of this.listeners.values()) {
      if (!this.current(generation)) return;
      if (listener.userId !== this.identity?.userId) continue;
      // One failing UI callback must not stop other subscribers or leak a rejection.
      try {
        void Promise.resolve(listener.notify(data)).catch(() => undefined);
      } catch {
        /* Subscriber owns its UI error. */
      }
    }
  }

  private async recover(generation: number) {
    if (
      !this.current(generation) ||
      this.recovering ||
      this.recoveredToken === this.identity?.token
    )
      return;
    this.recovering = true;
    try {
      await this.deps.recover(); // Existing HTTP single-flight refresh owns token rotation.
      if (generation !== this.generation) return;
      if (!this.current(generation)) {
        this.sync();
        return;
      }
      // HTTP may succeed with the same JWT. Try it only once, never a 401 busy loop.
      this.recoveredToken = this.identity!.token;
      this.socket?.connect();
    } catch (error) {
      const failure = error as {
        statusCode?: number;
        response?: { status?: number };
      } | null;
      const status = failure?.statusCode ?? failure?.response?.status;
      if (this.current(generation) && (status === 401 || status === 403))
        this.recoveredToken = this.identity!.token;
      if (this.current(generation) && status !== 401 && status !== 403) {
        this.later(generation, () => void this.recover(generation));
      }
    } finally {
      if (generation === this.generation) this.recovering = false;
    }
  }

  private later(generation: number, callback: () => void) {
    if (this.retry !== undefined) return;
    const delay = Math.min(1000 * 2 ** Math.min(this.attempts++, 5), 30000);
    this.retry = (this.deps.schedule ?? setTimeout)(() => {
      this.retry = undefined;
      if (this.current(generation)) callback();
    }, delay);
  }

  private dispose() {
    this.generation++;
    if (this.retry !== undefined)
      (this.deps.cancel ?? clearTimeout)(this.retry);
    this.retry = undefined;
    const socket = this.socket;
    this.socket = null;
    this.identity = null;
    this.loading = false;
    this.recovering = false;
    this.recoveredToken = null;
    this.attempts = 0;
    socket?.removeAllListeners();
    socket?.disconnect();
  }
}

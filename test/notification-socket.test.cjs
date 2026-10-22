const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { EventEmitter } = require("node:events");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  module._compile(result.outputText, filename);
};
const {
  NotificationConnection,
} = require("../src/realtime/notification-connection.ts");
const tick = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
class Socket extends EventEmitter {
  connected = false;
  connects = 0;
  disconnects = 0;
  tokens = [];
  constructor(options) {
    super();
    this.options = options;
  }
  connect() {
    this.connects++;
    this.options.auth((auth) => this.tokens.push(auth.token));
    return this;
  }
  disconnect() {
    this.disconnects++;
    this.connected = false;
    this.emit("disconnect", "io client disconnect");
    return this;
  }
  ready() {
    this.connected = true;
    this.emit("connect");
  }
}
function fixture() {
  let session = { userId: "alice", token: "alice-1" };
  const sockets = [],
    scheduled = new Map();
  let serial = 0,
    loads = 0,
    recoveries = 0;
  const io = (_url, options) => {
    const socket = new Socket(options);
    sockets.push(socket);
    return socket;
  };
  let loader = async () => io;
  let recovery = async () => undefined;
  const connection = new NotificationConnection({
    load: () => {
      loads++;
      return loader();
    },
    url: () => "https://api.test",
    session: () => session,
    recover: () => {
      recoveries++;
      return recovery();
    },
    schedule: (callback, delay) => {
      const id = ++serial;
      scheduled.set(id, { callback, delay });
      return id;
    },
    cancel: (id) => scheduled.delete(id),
  });
  return {
    connection,
    sockets,
    scheduled,
    io,
    session: (value) => {
      session = value;
    },
    load: (value) => {
      loader = value;
    },
    recover: (value) => {
      recovery = value;
    },
    counts: () => ({ loads, recoveries }),
    runTimer: () => {
      const [id, item] = scheduled.entries().next().value;
      scheduled.delete(id);
      item.callback();
    },
  };
}
const denied = (socket) =>
  socket.emit(
    "connect_error",
    Object.assign(new Error("Unauthorized"), { data: { status: 401 } }),
  );

test("components share one connection, receive reconnect refresh and release independently", async () => {
  const f = fixture(),
    a = [],
    b = [];
  const releaseA = f.connection.subscribe("alice", (data) => a.push(data));
  const releaseB = f.connection.subscribe("alice", (data) => b.push(data));
  await tick();
  assert.equal(f.sockets.length, 1);
  assert.equal(f.counts().loads, 1);
  const socket = f.sockets[0];
  socket.ready();
  socket.emit("notifications:new", { title: "new" });
  assert.deepEqual(a, [undefined, { title: "new" }]);
  assert.deepEqual(b, a);
  releaseA();
  releaseA();
  socket.emit("notifications:refresh");
  assert.equal(a.length, 2);
  assert.equal(b.length, 3);
  assert.equal(socket.disconnects, 0);
  releaseB();
  assert.equal(socket.disconnects, 1);
  assert.equal(socket.eventNames().length, 0);
});
test("Strict Mode unmount/remount fences old import completion", async () => {
  const f = fixture(),
    first = deferred(),
    second = deferred();
  let calls = 0;
  f.load(() => (++calls === 1 ? first.promise : second.promise));
  const release = f.connection.subscribe("alice", () => {});
  release();
  const final = f.connection.subscribe("alice", () => {});
  first.resolve(f.io);
  await tick();
  assert.equal(f.sockets.length, 0);
  second.resolve(f.io);
  await tick();
  assert.equal(f.sockets.length, 1);
  final();
});
test("logout while dynamic import is pending cannot create a socket", async () => {
  const f = fixture(),
    load = deferred();
  f.load(() => load.promise);
  const release = f.connection.subscribe("alice", () => {});
  f.connection.suspend();
  f.session(null);
  load.resolve(f.io);
  await tick();
  assert.equal(f.sockets.length, 0);
  release();
});
test("session becoming ready starts a previously tokenless subscription", async () => {
  const f = fixture();
  f.session(null);
  const release = f.connection.subscribe("alice", () => {});
  await tick();
  assert.equal(f.sockets.length, 0);
  f.session({ userId: "alice", token: "fresh" });
  f.connection.sessionChanged();
  await tick();
  assert.deepEqual(f.sockets[0].tokens, ["fresh"]);
  release();
});
test("token rotation replaces old socket and fences late events", async () => {
  const f = fixture(),
    received = [];
  const release = f.connection.subscribe("alice", (data) =>
    received.push(data),
  );
  await tick();
  const old = f.sockets[0];
  f.session({ userId: "alice", token: "alice-2" });
  f.connection.sessionChanged();
  await tick();
  assert.equal(old.disconnects, 1);
  assert.equal(old.eventNames().length, 0);
  assert.deepEqual(f.sockets[1].tokens, ["alice-2"]);
  old.emit("notifications:new", "stale");
  assert.deepEqual(received, []);
  release();
});
test("overlapping unauthorized/disconnect events share one recovery", async () => {
  const f = fixture(),
    recovered = deferred();
  f.recover(() => recovered.promise);
  const release = f.connection.subscribe("alice", () => {});
  await tick();
  const socket = f.sockets[0];
  denied(socket);
  socket.emit("disconnect", "io server disconnect");
  denied(socket);
  assert.equal(f.counts().recoveries, 1);
  f.session({ userId: "alice", token: "alice-2" });
  f.connection.sessionChanged();
  recovered.resolve();
  await tick();
  assert.equal(socket.connects, 1);
  assert.equal(f.sockets.length, 2);
  assert.equal(f.sockets[1].connects, 1);
  release();
});
test("logout cancels pending recovery immediately, before HTTP logout completes", async () => {
  const f = fixture(),
    recovered = deferred();
  f.recover(() => recovered.promise);
  const release = f.connection.subscribe("alice", () => {});
  await tick();
  const socket = f.sockets[0];
  denied(socket);
  f.connection.suspend();
  recovered.resolve();
  await tick();
  assert.equal(socket.disconnects, 1);
  assert.equal(socket.connects, 1);
  assert.equal(f.sockets.length, 1);
  release();
});
test("switching accounts during recovery cannot notify old account subscribers", async () => {
  const f = fixture(),
    recovery = deferred(),
    a = [],
    b = [];
  f.recover(() => recovery.promise);
  const releaseA = f.connection.subscribe("alice", (data) => a.push(data));
  await tick();
  denied(f.sockets[0]);
  f.session({ userId: "bob", token: "bob-1" });
  f.connection.sessionChanged();
  const releaseB = f.connection.subscribe("bob", (data) => b.push(data));
  recovery.resolve();
  await tick();
  assert.equal(f.sockets.length, 2);
  f.sockets[1].emit("notifications:new", "bob only");
  assert.deepEqual(a, []);
  assert.deepEqual(b, ["bob only"]);
  releaseA();
  assert.equal(f.sockets[1].disconnects, 0);
  releaseB();
});
test("same JWT rejected again after successful HTTP check does not cause a busy loop", async () => {
  const f = fixture();
  const release = f.connection.subscribe("alice", () => {});
  await tick();
  const socket = f.sockets[0];
  denied(socket);
  await tick();
  assert.equal(socket.connects, 2);
  denied(socket);
  await tick();
  assert.equal(socket.connects, 2);
  assert.equal(f.counts().recoveries, 1);
  release();
});
test("temporary recovery failure backs off and cancels timer on last unmount", async () => {
  const f = fixture();
  f.recover(async () => {
    throw { statusCode: 503 };
  });
  const release = f.connection.subscribe("alice", () => {});
  await tick();
  denied(f.sockets[0]);
  await tick();
  assert.equal([...f.scheduled.values()][0].delay, 1000);
  f.runTimer();
  await tick();
  assert.equal(f.counts().recoveries, 2);
  assert.equal([...f.scheduled.values()][0].delay, 2000);
  release();
  assert.equal(f.scheduled.size, 0);
});
test("terminal 401 recovery failure does not retry", async () => {
  const f = fixture();
  f.recover(async () => {
    throw { statusCode: 401 };
  });
  const release = f.connection.subscribe("alice", () => {});
  await tick();
  denied(f.sockets[0]);
  await tick();
  assert.equal(f.scheduled.size, 0);
  assert.equal(f.sockets[0].connects, 1);
  release();
});
test("failed module import retries with backoff and no duplicate connection", async () => {
  const f = fixture();
  f.load(async () => {
    throw Error("chunk unavailable");
  });
  const release = f.connection.subscribe("alice", () => {});
  await tick();
  assert.equal(f.scheduled.size, 1);
  f.load(async () => f.io);
  f.runTimer();
  await tick();
  assert.equal(f.sockets.length, 1);
  assert.equal(f.scheduled.size, 0);
  release();
});
test("failing subscriber does not prevent other subscribers receiving notifications", async () => {
  const f = fixture(),
    data = [];
  const a = f.connection.subscribe("alice", async () => {
    throw Error("UI failure");
  });
  const b = f.connection.subscribe("alice", (value) => data.push(value));
  await tick();
  f.sockets[0].emit("notifications:new", "message");
  await tick();
  assert.deepEqual(data, ["message"]);
  a();
  b();
});

function browserFixture() {
  const vm = require("node:vm");
  const values = new Map(),
    sockets = [];
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  class Browser extends EventTarget {
    handlers = new Map();
    location = {
      hostname: "localhost",
      protocol: "http:",
      origin: "http://localhost:3000",
    };
    addEventListener(name, callback) {
      super.addEventListener(name, callback);
      if (!this.handlers.has(name)) this.handlers.set(name, new Set());
      this.handlers.get(name).add(callback);
    }
    removeEventListener(name, callback) {
      super.removeEventListener(name, callback);
      this.handlers.get(name)?.delete(callback);
    }
  }
  let ending = false;
  const window = new Browser(),
    exports = {};
  const filename = require("node:path").resolve(
    __dirname,
    "../src/realtime/notification-client.ts",
  );
  const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(
    js,
    {
      exports,
      window,
      localStorage: storage,
      process: { env: {} },
      atob: (value) => Buffer.from(value, "base64").toString("binary"),
      require: (name) => {
        if (name === "../api/api")
          return { API_URL: "https://api.test/api/v1" };
        if (name === "../api/API_Auth")
          return { API_Auth: { getMe: async () => {} } };
        if (name === "../utils/authSession")
          return {
            AUTH_SESSION_EVENT: "apag:auth-session",
            isAuthSessionEnding: () => ending,
          };
        if (name === "./notification-connection")
          return { NotificationConnection };
        if (name === "socket.io-client")
          return {
            io: (_url, options) => {
              const socket = new Socket(options);
              sockets.push(socket);
              return socket;
            },
          };
        throw Error(`Unexpected import ${name}`);
      },
    },
    { filename },
  );
  const token = (user) =>
    `header.${Buffer.from(JSON.stringify({ sub: user })).toString("base64url")}.signature`;
  const authEvent = (phase = "changed") => {
    ending = phase === "ending";
    window.dispatchEvent(
      Object.assign(new Event("apag:auth-session"), { detail: phase }),
    );
  };
  const storageEvent = (key) =>
    window.dispatchEvent(Object.assign(new Event("storage"), { key }));
  return {
    ...exports,
    sockets,
    storage,
    window,
    token,
    authEvent,
    storageEvent,
  };
}
test("browser auth change reconnects with fresh JWT; logout event closes before token removal", async () => {
  const f = browserFixture();
  f.storage.setItem("user", JSON.stringify({ id: "alice" }));
  f.storage.setItem("accessToken", f.token("alice"));
  const release = f.subscribeNotifications("alice", () => {});
  await tick();
  assert.equal(f.sockets.length, 1);
  f.storage.setItem("accessToken", f.token("alice") + "rotated");
  f.authEvent();
  await tick();
  assert.equal(f.sockets[0].disconnects, 1);
  assert.equal(f.sockets.length, 2);
  f.authEvent("ending");
  assert.equal(f.sockets[1].disconnects, 1);
  release();
  assert.equal(f.window.handlers.get("apag:auth-session").size, 0);
  assert.equal(f.window.handlers.get("storage").size, 0);
});
test("cross-tab storage account switch cannot expose new account events to old UI", async () => {
  const f = browserFixture(),
    a = [],
    b = [];
  f.storage.setItem("user", JSON.stringify({ id: "alice" }));
  f.storage.setItem("accessToken", f.token("alice"));
  const releaseA = f.subscribeNotifications("alice", (data) => a.push(data));
  await tick();
  // Browser storage events arrive separately for each key: mixed user/token must be rejected.
  f.storage.setItem("accessToken", f.token("bob"));
  f.storageEvent("accessToken");
  await tick();
  assert.equal(f.sockets.length, 1);
  assert.equal(f.sockets[0].disconnects, 1);
  f.storage.setItem("user", JSON.stringify({ id: "bob" }));
  f.storageEvent("user");
  await tick();
  assert.equal(f.sockets.length, 1);
  const releaseB = f.subscribeNotifications("bob", (data) => b.push(data));
  await tick();
  f.sockets[1].emit("notifications:new", "bob");
  assert.deepEqual(a, []);
  assert.deepEqual(b, ["bob"]);
  f.storage.removeItem("accessToken");
  f.storageEvent("accessToken");
  assert.equal(f.sockets[1].disconnects, 1);
  releaseA();
  releaseB();
});
test("invalid stored token never creates an unauthenticated socket", async () => {
  const f = browserFixture();
  f.storage.setItem("user", JSON.stringify({ id: "alice" }));
  f.storage.setItem("accessToken", "invalid");
  const release = f.subscribeNotifications("alice", () => {});
  await tick();
  assert.equal(f.sockets.length, 0);
  release();
  assert.equal(f.getSocketBaseUrl(), "https://api.test");
});

test("new subscriber resumes after logout/login completed with all previous listeners unmounted", async () => {
  const f = browserFixture();
  f.storage.setItem("user", JSON.stringify({ id: "alice" }));
  f.storage.setItem("accessToken", f.token("alice"));
  const releaseA = f.subscribeNotifications("alice", () => {});
  await tick();
  f.authEvent("ending");
  releaseA();
  f.storage.setItem("user", JSON.stringify({ id: "bob" }));
  f.storage.setItem("accessToken", f.token("bob"));
  f.authEvent();
  const releaseB = f.subscribeNotifications("bob", () => {});
  await tick();
  assert.equal(f.sockets.length, 2);
  assert.deepEqual(f.sockets[1].tokens, [f.token("bob")]);
  releaseB();
});

/** Guards shared by every evaluation API wrapper; no automatic replay of a 409. */
export interface EvaluationRequest {
  url?: string;
  method?: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: unknown;
}
interface Intent {
  key: string;
  data: Record<string, unknown>;
  params?: Record<string, unknown>;
}
interface TransportError extends Error {
  statusCode?: number;
  userMessage?: string;
}
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(value)
          .filter(([, v]) => v !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, JSON.parse(canonical(v))]),
      ),
    );
  return JSON.stringify(value) ?? "null";
}
function conflict(message: string): TransportError {
  return Object.assign(new Error(message), {
    statusCode: 409,
    userMessage: message,
  });
}

export class EvaluationTransport {
  private versions = new Map<string, number>();
  private evidenceForms = new Map<string, string>();
  private queues = new Map<string, Promise<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private intents = new Map<string, Intent>();
  private blocked = new Set<string>();
  private uncertain = new Map<string, string>();
  private revision = 0;
  private writtenAt = new Map<string, number>();

  constructor(
    private storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">,
    private namespace = "evaluation-intent",
  ) {}
  reset() {
    this.versions.clear();
    this.evidenceForms.clear();
    this.blocked.clear();
    this.uncertain.clear();
    this.writtenAt.clear();
    this.intents.clear();
  }
  private remember(value: unknown, readRevision = Infinity) {
    if (Array.isArray(value)) {
      value.forEach((item) => this.remember(item, readRevision));
      return;
    }
    const item = record(value);
    if (
      typeof item.id === "string" &&
      typeof item.evaluationFormId === "string"
    )
      this.evidenceForms.set(item.id, item.evaluationFormId);
    if (
      typeof item.id === "string" &&
      Number.isInteger(item.version) &&
      (this.writtenAt.get(item.id) ?? -1) <= readRevision
    ) {
      this.versions.set(item.id, item.version as number);
      this.blocked.delete(item.id);
    }
    Object.values(item)
      .filter((v) => v && typeof v === "object")
      .forEach((v) => this.remember(v, readRevision));
  }
  private loadIntent(signature: string): Intent | undefined {
    if (this.intents.has(signature)) return this.intents.get(signature);
    try {
      const saved = this.storage?.getItem(`${this.namespace}:${signature}`);
      if (saved) return JSON.parse(saved) as Intent;
    } catch {
      /* Storage can be unavailable. */
    }
  }
  private saveIntent(signature: string, intent?: Intent) {
    if (intent) this.intents.set(signature, intent);
    else this.intents.delete(signature);
    try {
      if (intent)
        this.storage?.setItem(
          `${this.namespace}:${signature}`,
          JSON.stringify(intent),
        );
      else this.storage?.removeItem(`${this.namespace}:${signature}`);
    } catch {
      /* In-memory retries still keep the same key. */
    }
  }
  async run<T extends EvaluationRequest, R>(
    config: T,
    send: (config: T) => Promise<R>,
  ): Promise<R> {
    const url = config.url ?? "";
    const method = (config.method ?? "GET").toUpperCase();
    const evaluationRoute =
      /\/(?:training-evaluations|evaluations)(?:\/|$)/.test(url);
    const evidenceRoute = url.startsWith("/evidences");
    if (!evaluationRoute && !evidenceRoute) return send(config);
    if (method === "GET") {
      const revision = this.revision;
      const result = await send(config);
      this.remember(result, revision);
      return result;
    }
    const raw = record(config.data);
    const single = url.match(
      /\/(?:training-evaluations|evaluations)\/([0-9a-f-]{36})(?:\/|$)/i,
    )?.[1];
    const evidenceId = method === "DELETE" ? url.split("/").at(-1) : undefined;
    const formId =
      single ??
      (typeof raw.evaluationFormId === "string"
        ? raw.evaluationFormId
        : evidenceId
          ? this.evidenceForms.get(evidenceId)
          : undefined);
    // Creation of a form has a DB unique invariant, but no version exists yet.
    const isCreate = method === "POST" && url === "/training-evaluations";
    const useKey =
      !evidenceRoute &&
      !isCreate &&
      !url.endsWith("/reopen") &&
      /\/(submit|review|review-scores|confirm-review|return-to-student|finalize|bulk-finalize|finalize-by-filter|submit-to-advisor|submit-to-faculty|submit-to-training-department)$/.test(
        url,
      );
    const signature = canonical([method, url, raw, config.params]);
    const existing = this.inFlight.get(signature);
    if (existing) return existing as Promise<R>;
    const resource = formId ?? url;
    const queued = this.queues.get(resource) ?? Promise.resolve();
    const operation = queued
      .catch(() => {})
      .then(async () => {
        if (formId && this.blocked.has(formId))
          throw conflict(
            "Phiếu đã thay đổi. Vui lòng tải lại phiếu trước khi tiếp tục; dữ liệu chưa lưu vẫn được giữ trên màn hình.",
          );
        if (
          this.uncertain.has(resource) &&
          this.uncertain.get(resource) !== signature
        )
          throw conflict(
            "Chưa xác định kết quả thao tác trước. Vui lòng thử lại đúng thao tác đó trước khi thay đổi dữ liệu.",
          );
        let intent = useKey ? this.loadIntent(signature) : undefined;
        if (!intent) {
          const data = { ...raw };
          const params = { ...config.params };
          if (formId) {
            const version =
              data.expectedVersion ??
              params.expectedVersion ??
              this.versions.get(formId);
            if (!Number.isInteger(version))
              throw conflict(
                "Chưa có phiên bản phiếu. Vui lòng mở lại chi tiết phiếu trước khi thao tác.",
              );
            if (method === "DELETE") params.expectedVersion = version;
            else data.expectedVersion = version;
          }
          const selectedIds = url.endsWith("/bulk-finalize")
            ? data.ids
            : data.evaluationIds;
          if (Array.isArray(selectedIds)) {
            data.expectedVersions = selectedIds.map((id) => {
              const version = this.versions.get(String(id));
              if (version === undefined)
                throw conflict(
                  "Danh sách phiếu chưa có version. Vui lòng tải lại danh sách.",
                );
              return { id, version };
            });
          }
          intent = { key: useKey ? crypto.randomUUID() : "", data, params };
          if (useKey) this.saveIntent(signature, intent);
        }
        const headers = {
          ...record(config.headers),
          ...(useKey ? { "Idempotency-Key": intent.key } : {}),
        };
        try {
          const result = await send({
            ...config,
            data: intent.data,
            params: intent.params,
            headers,
          } as T);
          this.revision++;
          this.remember(result);
          if (formId) {
            this.writtenAt.set(formId, this.revision);
            const response = record(result);
            const version = response.evaluationVersion ?? response.version;
            if (Number.isInteger(version))
              this.versions.set(formId, version as number);
            else this.versions.delete(formId);
          }
          if (useKey) this.saveIntent(signature);
          this.uncertain.delete(resource);
          return result;
        } catch (error) {
          const status = (error as TransportError).statusCode;
          if (status === 409 && formId) this.blocked.add(formId);
          if (status && status >= 400 && status < 500) {
            if (useKey) this.saveIntent(signature);
            this.uncertain.delete(resource);
          } else if (useKey) {
            // Timeout/5xx may happen after commit. Preserve both key AND original expectedVersion.
            this.uncertain.set(resource, signature);
          }
          throw error;
        }
      });
    this.queues.set(resource, operation);
    this.inFlight.set(signature, operation);
    try {
      return await operation;
    } finally {
      if (this.inFlight.get(signature) === operation)
        this.inFlight.delete(signature);
      if (this.queues.get(resource) === operation) this.queues.delete(resource);
    }
  }
}

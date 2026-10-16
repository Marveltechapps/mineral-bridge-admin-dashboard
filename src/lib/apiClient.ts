/**
 * Thin fetch wrapper for the operations API. Configuration comes from
 * environment variables (see .env.example); no secrets live in the frontend.
 *
 * Base URL and timeout are read per request rather than once at import, so a
 * test can stub `import.meta.env` and so a future runtime config can replace
 * the build-time one without touching callers.
 */

const baseUrl = (): string =>
  (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const timeoutMs = (): number => Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;

/** True when no backend is configured and the console runs on bundled demo data. */
export const isDemoMode = (): boolean => baseUrl() === '';

/** Codes the client raises itself, for failures that never reached the server. */
export const CLIENT_ERROR_CODES = {
  /** `VITE_API_BASE_URL` is empty: the console is running on bundled demo data. */
  demoMode: 'client/demo-mode',
  /** The request did not complete within `VITE_API_TIMEOUT_MS`. */
  timeout: 'client/timeout',
  /** `fetch` itself failed: offline, DNS, TLS, CORS. */
  network: 'client/network',
  /** A 2xx response whose body was not the JSON the caller expected. */
  malformedResponse: 'client/malformed-response',
} as const;

/** Status reported for a request that never produced an HTTP response. */
export const NO_RESPONSE_STATUS = 0;

/** Status reported when the client's own timeout fires. */
export const TIMEOUT_STATUS = 408;

/**
 * The error every failed request rejects with.
 *
 * An operations console has to tell failures apart to respond correctly: `401`
 * the desk session expired, `403` this role is not permitted, `409` the order
 * already advanced or the lot is already allocated, `422` the form is invalid.
 * Callers need the status and a machine-readable `code`, not a message string
 * they would have to match on. `fields` carries per-field messages from a `422`.
 *
 * The constructor signature matches the web and mobile clients, so all three
 * front ends handle the same backend the same way.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly fields?: Record<string, string>,
    message?: string,
  ) {
    super(message ?? `Request failed (${status})`);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

/**
 * Per-field messages from a `422`. Accepts both `{ qty: 'Too high' }` and the
 * `{ qty: ['Too high'] }` spelling many frameworks produce.
 */
function readFields(body: Record<string, unknown>): Record<string, string> | undefined {
  const raw = asRecord(body.fields) ?? asRecord(body.errors);
  if (!raw) return undefined;
  const fields: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw)) {
    const message = Array.isArray(value) ? asString(value[0]) : asString(value);
    if (message) fields[name] = message;
  }
  return Object.keys(fields).length ? fields : undefined;
}

/** Reads a response body as JSON, or `undefined` when there is no body. */
async function readBody(res: Response): Promise<unknown> {
  if (res.status === 204 || res.status === 205 || res.status === 304) return undefined;
  const text = await res.text();
  if (text.trim() === '') return undefined;
  return JSON.parse(text) as unknown;
}

/**
 * Builds the `ApiError` for a non-2xx response. Reads `{ code, message, fields? }`,
 * also `{ error: { code, message } }` and `{ detail }`, and still produces an
 * error carrying the real status when the body is not JSON at all — an HTML
 * error page from a reverse proxy, for instance.
 */
async function errorFromResponse(res: Response): Promise<ApiError> {
  const body = asRecord(await readBody(res).catch(() => undefined));
  const nested = body ? asRecord(body.error) : undefined;
  const code =
    (body && asString(body.code)) ??
    (nested && asString(nested.code)) ??
    (body && asString(body.error)) ??
    `http/${res.status}`;
  const message =
    (body && (asString(body.message) ?? asString(body.detail))) ??
    (nested && asString(nested.message)) ??
    `Request failed (${res.status} ${res.statusText})`;
  return new ApiError(res.status, code, body ? readFields(body) : undefined, message);
}

export interface ApiRequestInit extends Omit<RequestInit, 'signal'> {
  /** Caller cancellation — pass the signal TanStack Query hands the query function. */
  signal?: AbortSignal | null;
  /** Overrides `VITE_API_TIMEOUT_MS` for this one request. */
  timeoutMs?: number;
}

export async function apiRequest<T>(
  path: string,
  { signal, timeoutMs: perRequestTimeout, headers, ...init }: ApiRequestInit = {},
): Promise<T> {
  if (isDemoMode()) {
    throw new ApiError(
      NO_RESPONSE_STATUS,
      CLIENT_ERROR_CODES.demoMode,
      undefined,
      'No API configured: VITE_API_BASE_URL is empty, so the console is running on bundled demo data.',
    );
  }

  // The timeout and the caller each need to be able to cancel, so both feed one
  // controller. `signal.addEventListener` alone would miss a signal that is
  // already aborted when the request starts, so that case is checked directly.
  const controller = new AbortController();
  let timedOut = false;
  const limit = perRequestTimeout ?? timeoutMs();
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, limit);
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) abortFromCaller();
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  let res: Response;
  try {
    // `init` is spread first so that the merged headers, credentials and signal
    // below cannot be overwritten by it. Spreading it last used to replace the
    // whole merged headers object whenever a caller passed any header of its
    // own, silently dropping Content-Type.
    res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      credentials: init.credentials ?? 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      signal: controller.signal,
    });
  } catch (error) {
    // The caller's cancellation is theirs: rethrow it unchanged so TanStack
    // Query sees an ordinary abort rather than a failure worth retrying.
    if (signal?.aborted) throw error;
    if (timedOut) {
      throw new ApiError(
        TIMEOUT_STATUS,
        CLIENT_ERROR_CODES.timeout,
        undefined,
        `${init.method ?? 'GET'} ${path} timed out after ${limit}ms`,
      );
    }
    throw new ApiError(
      NO_RESPONSE_STATUS,
      CLIENT_ERROR_CODES.network,
      undefined,
      error instanceof Error ? error.message : `${init.method ?? 'GET'} ${path} could not be sent`,
    );
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }

  if (!res.ok) throw await errorFromResponse(res);

  try {
    return (await readBody(res)) as T;
  } catch {
    throw new ApiError(
      res.status,
      CLIENT_ERROR_CODES.malformedResponse,
      undefined,
      `${init.method ?? 'GET'} ${path} returned a body that is not valid JSON`,
    );
  }
}

/** Resolves to the bundled demo fixture while no backend is configured, otherwise calls the API. */
export function apiRequestOrDemo<T>(path: string, demo: T, init?: ApiRequestInit): Promise<T> {
  return isDemoMode() ? Promise.resolve(demo) : apiRequest<T>(path, init);
}

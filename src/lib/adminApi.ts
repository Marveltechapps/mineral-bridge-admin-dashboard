/** Cookie session client for `/v2/admin`. The dev server proxies this path to the API. */

export class AdminApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let csrf = '';

export function rememberCsrf(token: string | null | undefined) {
  if (token) csrf = token;
}

export function adminHeaders(method: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('Accept', 'application/json');
  headers.set('X-Client', 'admin');
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }
  return headers;
}

export async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const response = await fetch(`/v2/admin/${path.replace(/^\//, '')}`, {
    ...init,
    method,
    credentials: 'include',
    headers: adminHeaders(method, init.headers),
  });
  rememberCsrf(response.headers.get('X-CSRF-Token') || response.headers.get('x-csrf-token'));
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const body = text ? JSON.parse(text) as { code?: string; message?: string } : {};
  if (!response.ok) {
    throw new AdminApiError(response.status, body.code || 'request/failed', body.message || `Request failed (${response.status})`);
  }
  return body as T;
}

export const adminApi = {
  get: <T>(path: string) => adminRequest<T>(path),
  post: <T>(path: string, body?: unknown) => adminRequest<T>(path, { method: 'POST', body: body == null ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => adminRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  /** Most deletes carry no body. Soft deletes that need a reason send one. */
  delete: <T = void>(path: string, body?: unknown) =>
    adminRequest<T>(path, { method: 'DELETE', body: body == null ? undefined : JSON.stringify(body) }),
};

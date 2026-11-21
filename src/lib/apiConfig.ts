/**
 * Same-origin API paths. The browser never calls a host or port.
 * In development, Vite proxies these prefixes. In production, the host that
 * serves the dashboard must proxy the same prefixes to the Mineral Bridge API.
 */
export const API_ROUTES = {
  adminV2: '/v2/admin',
  adminV1: '/admin/v1',
  samples: '/api',
} as const;

/** Joins a prefix and a path without producing a double slash. */
export function apiUrl(prefix: string, path = ''): string {
  const tail = path.replace(/^\//, '');
  return tail ? `${prefix}/${tail}` : prefix;
}

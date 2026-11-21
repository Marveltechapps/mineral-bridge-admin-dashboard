/**
 * Dev-server only. Picks an origin that is the Mineral Bridge API.
 * Loopback names are probed on both stacks so "localhost" cannot be sent to a
 * different application that happens to own the same port on IPv4 or IPv6.
 * This module is not imported by the browser bundle.
 */

export class ApiProxyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiProxyError';
  }
}

export interface OriginProbe {
  healthStatus: number | null;
  healthBody: unknown;
  meStatus: number | null;
  meBody: unknown;
}

export interface OriginResult extends OriginProbe {
  origin: string;
}

export interface ProxyEnv {
  API_PORT?: string;
  API_PROXY_TARGET?: string;
  VITE_API_URL?: string;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return LOOPBACK_HOSTS.has(host) || host.startsWith('127.');
}

export function isMineralBridge(probe: OriginProbe): boolean {
  const health = asRecord(probe.healthBody);
  const me = asRecord(probe.meBody);
  return probe.healthStatus === 200
    && health?.status === 'ok'
    && typeof health.uptimeSeconds === 'number'
    && probe.meStatus === 401
    && me?.code === 'auth/session-expired';
}

function portOf(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ApiProxyError(`API target is not a valid URL: ${raw}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ApiProxyError(`API target must be http or https: ${raw}`);
  }
  if (!url.port) return url.protocol === 'https:' ? 443 : 80;
  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ApiProxyError(`API target has an invalid port: ${raw}`);
  }
  return port;
}

function configuredPort(env: ProxyEnv): number | null {
  const raw = (env.API_PORT ?? '').trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) throw new ApiProxyError('API_PORT must be a whole number.');
  const port = Number(raw);
  if (port < 1 || port > 65535) throw new ApiProxyError('API_PORT must be between 1 and 65535.');
  return port;
}

function originOf(raw: string): string {
  return new URL(raw.trim()).origin;
}

export interface OriginPlan {
  explicit: string;
  port: number;
  candidates: string[];
}

/**
 * Origins to probe. A non-loopback API_PROXY_TARGET is used alone, so a remote
 * API is never replaced with this machine's loopback. Loopback targets are
 * expanded to 127.0.0.1 and ::1 on the configured port.
 */
export function candidateOrigins(env: ProxyEnv): OriginPlan {
  const explicitRaw = (env.API_PROXY_TARGET || env.VITE_API_URL || '').trim();
  const port = portOf(explicitRaw) ?? configuredPort(env) ?? 5001;
  if (explicitRaw && !isLoopbackHostname(new URL(explicitRaw).hostname)) {
    const explicit = originOf(explicitRaw);
    return { explicit, candidates: [explicit], port };
  }
  return {
    explicit: '',
    port,
    candidates: [`http://127.0.0.1:${port}`, `http://[::1]:${port}`],
  };
}

function hostOf(origin: string): string {
  return new URL(origin).hostname;
}

export function selectMineralBridgeOrigin(results: OriginResult[], explicit = ''): string {
  const matches = results.filter(isMineralBridge);
  if (explicit) {
    const hit = matches.find((probe) => probe.origin === explicit);
    if (!hit) {
      throw new ApiProxyError(
        `API_PROXY_TARGET ${explicit} did not answer as the Mineral Bridge API. The dev server will not proxy to it.`,
      );
    }
    return hit.origin;
  }
  for (const host of ['127.0.0.1', '::1']) {
    const hit = matches.find((probe) => hostOf(probe.origin) === host);
    if (hit) return hit.origin;
  }
  const fallback = matches[0];
  if (fallback) return fallback.origin;
  const tried = results.map((probe) => `${probe.origin} health=${probe.healthStatus ?? 'down'} me=${probe.meStatus ?? 'down'}`).join('; ');
  throw new ApiProxyError(
    `No Mineral Bridge API found. Refusing to proxy to another application on the same port. Tried: ${tried || 'no candidates'}`,
  );
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function probeOrigin(origin: string, timeoutMs = 1500): Promise<OriginProbe> {
  const one = async (path: string): Promise<{ status: number | null; body: unknown }> => {
    try {
      const response = await fetch(`${origin}${path}`, {
        headers: { Accept: 'application/json', 'X-Client': 'admin' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      return { status: response.status, body: await readJson(response) };
    } catch {
      return { status: null, body: null };
    }
  };
  const [health, me] = await Promise.all([one('/health'), one('/v2/admin/me')]);
  return {
    healthStatus: health.status,
    healthBody: health.body,
    meStatus: me.status,
    meBody: me.body,
  };
}

export async function resolveApiProxyTarget(
  env: ProxyEnv,
  probe: (origin: string) => Promise<OriginProbe> = probeOrigin,
): Promise<string> {
  const plan = candidateOrigins(env);
  const results = await Promise.all(plan.candidates.map(async (origin) => ({
    origin,
    ...(await probe(origin)),
  })));
  return selectMineralBridgeOrigin(results, plan.explicit);
}

export interface DevProxyRoute {
  target: string;
  changeOrigin: boolean;
}

/** Proxy table for `vite serve` only. Production builds do not receive it. */
export function devProxyFor(command: string, target: string): { '/api': DevProxyRoute; '/admin': DevProxyRoute; '/v2': DevProxyRoute } | undefined {
  if (command !== 'serve' || !target) return undefined;
  const route = { target, changeOrigin: true as const };
  return { '/api': route, '/admin': route, '/v2': route };
}

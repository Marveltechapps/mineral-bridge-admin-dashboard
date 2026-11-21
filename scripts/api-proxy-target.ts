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
  /** Dev-server only. Wins over API_PROXY_TARGET and VITE_API_URL. */
  API_BASE_URL?: string;
  API_PORT?: string;
  API_PROXY_TARGET?: string;
  VITE_API_URL?: string;
}

/** IPv4 loopback. On Windows, "localhost" can be ::1 while the API binds 0.0.0.0. */
export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:5001';

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
 * Origins to probe. API_BASE_URL wins, then API_PROXY_TARGET, then VITE_API_URL.
 * A non-loopback origin is used alone, so a remote API is never replaced with
 * this machine's loopback. Loopback targets are expanded to 127.0.0.1 and ::1.
 */
function configuredOrigin(env: ProxyEnv): string {
  return (env.API_BASE_URL || env.API_PROXY_TARGET || env.VITE_API_URL || '').trim();
}

export function candidateOrigins(env: ProxyEnv): OriginPlan {
  const explicitRaw = configuredOrigin(env);
  const port = portOf(explicitRaw) ?? configuredPort(env) ?? portOf(DEFAULT_API_BASE_URL) ?? 5001;
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

function isUnreachable(probe: OriginProbe): boolean {
  return probe.healthStatus === null && probe.meStatus === null;
}

function describeProbe(probe: OriginResult): string {
  return `${probe.origin} health=${probe.healthStatus ?? 'down'} me=${probe.meStatus ?? 'down'}`;
}

/**
 * What the dev server prints, and what a proxied request returns, when the
 * configured origin accepts no connection. Identity mismatches still throw.
 */
export function backendUnavailableMessage(origin: string): string {
  return [
    `Mineral Bridge API is not accepting connections at ${origin}.`,
    'The dashboard dev server is up and will proxy /v2, /admin, and /api to that origin.',
    'Those requests fail until the API process is listening.',
    '',
    'The API does not open its port until MongoDB is connected. Redis is optional: leave REDIS_URL unset for a single process.',
    '',
    'Fresh clone, from the repository root.',
    'PowerShell:',
    '  cd mineralbridge-backend',
    '  Copy-Item .env.example .env',
    '  docker compose up -d --wait mongo',
    '  npm install',
    '  npm run seed',
    '  npm run dev',
    'CMD: use "copy .env.example .env" in place of Copy-Item. Then run the same npm commands.',
    '',
    `Once it is up, GET /health returns 200 {"status":"ok","uptimeSeconds":<number>} and GET /v2/admin/me with X-Client: admin returns 401 {"code":"auth/session-expired"}.`,
    `The API listens on PORT (default 5001). Set API_BASE_URL in MB-Dashboard/.env.local when that origin is not ${DEFAULT_API_BASE_URL}.`,
  ].join('\n');
}

function identityRefusal(results: OriginResult[], target: string): ApiProxyError {
  const tried = results.map(describeProbe).join('; ');
  return new ApiProxyError(
    [
      `No Mineral Bridge API found at ${target}. Refusing to proxy to another application.`,
      `Tried: ${tried || 'no candidates'}.`,
      'A Mineral Bridge API answers GET /health with 200 {"status":"ok","uptimeSeconds":<number>} and GET /v2/admin/me with X-Client: admin with 401 {"code":"auth/session-expired"}.',
      `Point API_BASE_URL in MB-Dashboard/.env.local at that API. The default is ${DEFAULT_API_BASE_URL}.`,
    ].join(' '),
  );
}

export function selectMineralBridgeOrigin(results: OriginResult[], explicit = ''): string {
  const matches = results.filter(isMineralBridge);
  if (explicit) {
    const hit = matches.find((probe) => probe.origin === explicit);
    if (hit) return hit.origin;
    const explicitResult = results.find((probe) => probe.origin === explicit);
    if (explicitResult && isUnreachable(explicitResult)) return explicitResult.origin;
    throw identityRefusal(results, explicit);
  }
  for (const host of ['127.0.0.1', '::1']) {
    const hit = matches.find((probe) => hostOf(probe.origin) === host);
    if (hit) return hit.origin;
  }
  if (matches[0]) return matches[0].origin;
  if (results.length > 0 && results.every(isUnreachable)) {
    const ipv4 = results.find((probe) => hostOf(probe.origin) === '127.0.0.1');
    return (ipv4 ?? results[0]).origin;
  }
  throw identityRefusal(results, 'the configured origin');
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

export interface ResolvedProxy {
  origin: string;
  /** Set when nothing accepted a connection. The dev server still starts. */
  warning: string | null;
}

export async function resolveApiProxyTarget(
  env: ProxyEnv,
  probe: (origin: string) => Promise<OriginProbe> = probeOrigin,
): Promise<ResolvedProxy> {
  const plan = candidateOrigins(env);
  const results = await Promise.all(plan.candidates.map(async (origin) => ({
    origin,
    ...(await probe(origin)),
  })));
  const origin = selectMineralBridgeOrigin(results, plan.explicit);
  const available = results.some((probeResult) => probeResult.origin === origin && isMineralBridge(probeResult));
  return { origin, warning: available ? null : backendUnavailableMessage(origin) };
}

export interface DevProxyRoute {
  target: string;
  changeOrigin: boolean;
  configure: (proxy: { on(event: 'error', listener: (err: Error, req: unknown, res: unknown) => void): void }) => void;
}

/** Proxy table for `vite serve` only. Production builds do not receive it. */
export function devProxyFor(command: string, target: string): { '/api': DevProxyRoute; '/admin': DevProxyRoute; '/v2': DevProxyRoute } | undefined {
  if (command !== 'serve' || !target) return undefined;
  const route: DevProxyRoute = {
    target,
    changeOrigin: true,
    configure(proxy) {
      proxy.on('error', (err, _req, res) => {
        const response = res as { headersSent?: boolean; writeHead?: (status: number, headers: Record<string, string>) => void; end?: (body: string) => void };
        if (!response?.writeHead || !response.end || response.headersSent) return;
        response.writeHead(503, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        response.end(JSON.stringify({
          code: 'api/unavailable',
          message: backendUnavailableMessage(target),
          cause: err instanceof Error ? err.message : 'connection failed',
        }));
      });
    },
  };
  return { '/api': route, '/admin': route, '/v2': route };
}

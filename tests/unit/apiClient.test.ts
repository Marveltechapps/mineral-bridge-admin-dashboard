import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  CLIENT_ERROR_CODES,
  NO_RESPONSE_STATUS,
  TIMEOUT_STATUS,
  apiRequest,
  apiRequestOrDemo,
  isApiError,
  isDemoMode,
} from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';

const BASE = 'https://ops.mineralbridge.test/v1';

interface FetchCall {
  url: string;
  init: RequestInit;
}

function stubFetch(handler: (call: FetchCall) => Promise<Response>) {
  const calls: FetchCall[] = [];
  vi.stubGlobal('fetch', ((input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    return handler({ url: String(input), init });
  }) as typeof fetch);
  return calls;
}

const json = (body: unknown, status = 200, statusText = ''): Response =>
  new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'content-type': 'application/json' },
  });

/** A fetch that never settles until its signal aborts, as the real one behaves. */
const pendingFetch = ((_input: RequestInfo | URL, init: RequestInit = {}) =>
  new Promise<Response>((_resolve, reject) => {
    const { signal } = init;
    const fail = () => {
      const error = new Error('The operation was aborted.');
      error.name = 'AbortError';
      reject(error);
    };
    if (signal?.aborted) fail();
    else signal?.addEventListener('abort', fail);
  })) as typeof fetch;

const headersOf = (call: FetchCall) => call.init.headers as Record<string, string>;

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('demo mode', () => {
  it('serves the bundled fixture and makes no request', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    const calls = stubFetch(() => Promise.resolve(json({ from: 'network' })));

    expect(isDemoMode()).toBe(true);
    await expect(apiRequestOrDemo('/orders', { from: 'demo' })).resolves.toEqual({
      from: 'demo',
    });
    expect(calls).toHaveLength(0);
  });

  it('fails fast rather than hanging when apiRequest is called directly', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    const error = await apiRequest('/orders').catch((e: unknown) => e);

    expect(isApiError(error)).toBe(true);
    expect((error as ApiError).code).toBe(CLIENT_ERROR_CODES.demoMode);
    expect((error as ApiError).status).toBe(NO_RESPONSE_STATUS);
  });

  it('calls the API once a base URL is configured', async () => {
    const calls = stubFetch(() => Promise.resolve(json({ from: 'network' })));

    expect(isDemoMode()).toBe(false);
    await expect(apiRequestOrDemo('/orders', { from: 'demo' })).resolves.toEqual({
      from: 'network',
    });
    expect(calls).toHaveLength(1);
  });
});

describe('request shape', () => {
  it('sends JSON headers and credentials', async () => {
    const calls = stubFetch(() => Promise.resolve(json([])));

    await apiRequest('/orders');

    expect(calls[0].url).toBe(`${BASE}/orders`);
    expect(headersOf(calls[0])['Content-Type']).toBe('application/json');
    expect(headersOf(calls[0]).Accept).toBe('application/json');
    expect(calls[0].init.credentials).toBe('include');
  });

  it('keeps Content-Type when the caller adds a header of its own', async () => {
    // The defect this covers: `...init` was spread after the merged headers, so
    // any caller-supplied header replaced the whole object and dropped
    // Content-Type — which a POST to the operations API would be rejected for.
    const calls = stubFetch(() => Promise.resolve(json({ ok: true })));

    await apiRequest('/orders', {
      method: 'POST',
      headers: { 'X-Desk-Action': 'advance' },
      body: JSON.stringify({ stage: 2 }),
    });

    expect(headersOf(calls[0])['Content-Type']).toBe('application/json');
    expect(headersOf(calls[0])['X-Desk-Action']).toBe('advance');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.credentials).toBe('include');
  });

  it('lets the caller override Content-Type deliberately', async () => {
    const calls = stubFetch(() => Promise.resolve(json({})));

    await apiRequest('/documents', { headers: { 'Content-Type': 'text/csv' } });

    expect(headersOf(calls[0])['Content-Type']).toBe('text/csv');
  });

  it('returns undefined for a 204 instead of throwing on an empty body', async () => {
    stubFetch(() => Promise.resolve(new Response(null, { status: 204 })));

    await expect(apiRequest('/orders/x/advance')).resolves.toBeUndefined();
  });
});

describe('cancellation', () => {
  it("honours the caller's signal", async () => {
    vi.stubGlobal('fetch', pendingFetch);
    const controller = new AbortController();

    const pending = apiRequest('/orders', { signal: controller.signal });
    controller.abort();

    const error = await pending.catch((e: unknown) => e);
    // A cancellation is the caller's own, so it arrives unchanged.
    expect(isApiError(error)).toBe(false);
  });

  it('cancels a request whose signal was already aborted before it started', async () => {
    // `addEventListener` alone never fires for an already-aborted signal, so
    // this request used to run to its full timeout instead of stopping.
    vi.stubGlobal('fetch', pendingFetch);
    const controller = new AbortController();
    controller.abort();

    await expect(
      apiRequest('/orders', { signal: controller.signal }),
    ).rejects.toBeTruthy();
  });

  it('still times out when the caller never aborts', async () => {
    vi.stubGlobal('fetch', pendingFetch);
    const controller = new AbortController();

    const error = await apiRequest('/orders', {
      signal: controller.signal,
      timeoutMs: 10,
    }).catch((e: unknown) => e);

    expect((error as ApiError).code).toBe(CLIENT_ERROR_CODES.timeout);
    expect((error as ApiError).status).toBe(TIMEOUT_STATUS);
  });
});

describe('error responses', () => {
  it('carries the status and the server code', async () => {
    stubFetch(() =>
      Promise.resolve(
        json({ code: 'order/already-advanced', message: 'Order is already at Payment released' }, 409),
      ),
    );

    const error = await apiRequest('/orders/x/advance').catch((e: unknown) => e);

    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).code).toBe('order/already-advanced');
    expect((error as ApiError).message).toBe('Order is already at Payment released');
  });

  it('tells an expired session from a forbidden role', async () => {
    stubFetch(() => Promise.resolve(json({ code: 'auth/expired' }, 401)));
    const expired = await apiRequest('/orders').catch((e: unknown) => e);

    stubFetch(() => Promise.resolve(json({ code: 'role/not-permitted' }, 403)));
    const forbidden = await apiRequest('/settings/roles').catch((e: unknown) => e);

    expect((expired as ApiError).status).toBe(401);
    expect((expired as ApiError).code).toBe('auth/expired');
    expect((forbidden as ApiError).status).toBe(403);
    expect((forbidden as ApiError).code).toBe('role/not-permitted');
  });

  it('reads per-field messages from a 422', async () => {
    stubFetch(() =>
      Promise.resolve(json({ code: 'validation/failed', fields: { price: 'Below the floor rate' } }, 422)),
    );

    const error = await apiRequest('/pricing/offers', { method: 'POST' }).catch(
      (e: unknown) => e,
    );

    expect((error as ApiError).fields).toEqual({ price: 'Below the floor rate' });
  });

  it('accepts the array spelling of field errors', async () => {
    stubFetch(() => Promise.resolve(json({ errors: { email: ['Not a staff address'] } }, 422)));

    const error = await apiRequest('/users').catch((e: unknown) => e);

    expect((error as ApiError).fields).toEqual({ email: 'Not a staff address' });
  });

  it('reads a nested error envelope', async () => {
    stubFetch(() =>
      Promise.resolve(json({ error: { code: 'vault/locked', message: 'Vault is sealed' } }, 400)),
    );

    const error = await apiRequest('/vault/lots').catch((e: unknown) => e);

    expect((error as ApiError).code).toBe('vault/locked');
    expect((error as ApiError).message).toBe('Vault is sealed');
  });

  it('still carries the status when a proxy returns HTML', async () => {
    stubFetch(() =>
      Promise.resolve(new Response('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' })),
    );

    const error = await apiRequest('/orders').catch((e: unknown) => e);

    expect((error as ApiError).status).toBe(502);
    expect((error as ApiError).code).toBe('http/502');
  });

  it('reports a network failure and a malformed 2xx body distinctly', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    const offline = await apiRequest('/orders').catch((e: unknown) => e);

    stubFetch(() => Promise.resolve(new Response('not json', { status: 200 })));
    const malformed = await apiRequest('/orders').catch((e: unknown) => e);

    expect((offline as ApiError).code).toBe(CLIENT_ERROR_CODES.network);
    expect((malformed as ApiError).code).toBe(CLIENT_ERROR_CODES.malformedResponse);
  });
});

describe('query policy', () => {
  const retry = queryClient.getDefaultOptions().queries?.retry as (
    failureCount: number,
    error: unknown,
  ) => boolean;

  it('never retries a failure the backend will repeat', () => {
    for (const status of [401, 403, 404, 409, 422]) {
      expect(retry(0, new ApiError(status, `http/${status}`))).toBe(false);
    }
  });

  it('retries a server fault, then gives up', () => {
    expect(retry(0, new ApiError(500, 'http/500'))).toBe(true);
    expect(retry(1, new ApiError(503, 'http/503'))).toBe(true);
    expect(retry(2, new ApiError(500, 'http/500'))).toBe(false);
  });

  it('retries a transport failure that produced no response', () => {
    expect(retry(0, new ApiError(NO_RESPONSE_STATUS, CLIENT_ERROR_CODES.network))).toBe(true);
    expect(retry(0, new ApiError(TIMEOUT_STATUS, CLIENT_ERROR_CODES.timeout))).toBe(true);
    // A non-ApiError (an unexpected throw) is still worth one more attempt.
    expect(retry(0, new Error('boom'))).toBe(true);
  });

  it('does not retry failures that are not transient', () => {
    // Demo mode and a malformed body answer identically however often asked.
    expect(retry(0, new ApiError(NO_RESPONSE_STATUS, CLIENT_ERROR_CODES.demoMode))).toBe(
      false,
    );
    expect(
      retry(0, new ApiError(200, CLIENT_ERROR_CODES.malformedResponse)),
    ).toBe(false);
  });

  it('does not retry desk mutations', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(false);
  });
});

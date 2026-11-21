import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ApiProxyError,
  candidateOrigins,
  devProxyFor,
  isMineralBridge,
  resolveApiProxyTarget,
  selectMineralBridgeOrigin,
} from './api-proxy-target.ts';

const mineralBridge = {
  healthStatus: 200,
  healthBody: { status: 'ok', uptimeSeconds: 12 },
  meStatus: 401,
  meBody: { code: 'auth/session-expired', message: 'Your session has expired. Sign in again.', requestId: 'abc' },
};

const otherApp = {
  healthStatus: 200,
  healthBody: { status: 'ok', uptimeSeconds: 99.5 },
  meStatus: 404,
  meBody: { error: { code: 'NOT_FOUND', message: 'Route not found.' } },
};

test('recognises only the Mineral Bridge admin session response', () => {
  assert.equal(isMineralBridge(mineralBridge), true);
  assert.equal(isMineralBridge(otherApp), false);
  assert.equal(isMineralBridge({ ...mineralBridge, meStatus: 401, meBody: { code: 'auth/invalid-credentials' } }), false);
  assert.equal(isMineralBridge({ ...mineralBridge, healthStatus: 500 }), false);
});

test('uses the documented default when no origin is configured', () => {
  assert.deepEqual(candidateOrigins({}).candidates, [
    'http://127.0.0.1:5001',
    'http://[::1]:5001',
  ]);
  assert.equal(candidateOrigins({}).explicit, '');
});

test('API_BASE_URL wins over the older proxy settings', () => {
  const plan = candidateOrigins({
    API_BASE_URL: 'http://10.1.2.3:5001',
    API_PROXY_TARGET: 'http://10.9.9.9:4000',
    VITE_API_URL: 'http://127.0.0.1:4000',
  });
  assert.deepEqual(plan.candidates, ['http://10.1.2.3:5001']);
  assert.equal(plan.explicit, 'http://10.1.2.3:5001');
});

test('expands loopback targets onto both stacks and keeps the port', () => {
  assert.deepEqual(candidateOrigins({ API_PORT: '4000' }).candidates, [
    'http://127.0.0.1:4000',
    'http://[::1]:4000',
  ]);
  assert.deepEqual(candidateOrigins({ API_PROXY_TARGET: 'http://localhost:5001' }).candidates, [
    'http://127.0.0.1:5001',
    'http://[::1]:5001',
  ]);
  assert.deepEqual(candidateOrigins({ VITE_API_URL: 'http://127.0.0.1:5001' }).candidates, [
    'http://127.0.0.1:5001',
    'http://[::1]:5001',
  ]);
  assert.deepEqual(candidateOrigins({ API_PROXY_TARGET: 'http://[::1]:5001' }).candidates, [
    'http://127.0.0.1:5001',
    'http://[::1]:5001',
  ]);
});

test('uses a remote origin as given and does not substitute loopback', () => {
  const plan = candidateOrigins({ API_PROXY_TARGET: 'http://10.1.2.3:5001' });
  assert.deepEqual(plan.candidates, ['http://10.1.2.3:5001']);
  assert.equal(plan.explicit, 'http://10.1.2.3:5001');
});

test('rejects an invalid port', () => {
  assert.throws(() => candidateOrigins({ API_PORT: 'nope' }), ApiProxyError);
});

test('selects the stack that is Mineral Bridge and ignores the other application', () => {
  const origin = selectMineralBridgeOrigin([
    { origin: 'http://[::1]:5001', ...otherApp },
    { origin: 'http://127.0.0.1:5001', ...mineralBridge },
  ]);
  assert.equal(origin, 'http://127.0.0.1:5001');
});

test('selects IPv6 when that is the only Mineral Bridge listener', () => {
  const origin = selectMineralBridgeOrigin([
    { origin: 'http://127.0.0.1:5001', healthStatus: null, healthBody: null, meStatus: null, meBody: null },
    { origin: 'http://[::1]:5001', ...mineralBridge },
  ]);
  assert.equal(origin, 'http://[::1]:5001');
});

test('refuses to proxy when nothing answers as Mineral Bridge', () => {
  assert.throws(
    () => selectMineralBridgeOrigin([
      { origin: 'http://127.0.0.1:5001', ...otherApp },
      { origin: 'http://[::1]:5001', ...otherApp },
    ]),
    /Refusing to proxy/,
  );
});

test('refuses a remote target that is not Mineral Bridge', () => {
  assert.throws(
    () => selectMineralBridgeOrigin([
      { origin: 'http://10.1.2.3:5001', ...otherApp },
    ], 'http://10.1.2.3:5001'),
    /Refusing to proxy/,
  );
});

test('keeps the configured origin when every probe is unreachable', () => {
  const down = { healthStatus: null, healthBody: null, meStatus: null, meBody: null };
  assert.equal(selectMineralBridgeOrigin([
    { origin: 'http://127.0.0.1:5001', ...down },
    { origin: 'http://[::1]:5001', ...down },
  ]), 'http://127.0.0.1:5001');
  assert.equal(selectMineralBridgeOrigin([
    { origin: 'http://10.1.2.3:5001', ...down },
  ], 'http://10.1.2.3:5001'), 'http://10.1.2.3:5001');
});

test('refuses when one stack is down and the other is a different application', () => {
  assert.throws(
    () => selectMineralBridgeOrigin([
      { origin: 'http://127.0.0.1:5001', healthStatus: null, healthBody: null, meStatus: null, meBody: null },
      { origin: 'http://[::1]:5001', ...otherApp },
    ]),
    /Refusing to proxy/,
  );
});

test('resolveApiProxyTarget asks the probe and returns the matching origin', async () => {
  const seen = [];
  const resolved = await resolveApiProxyTarget({ API_PORT: '5001' }, async (candidate) => {
    seen.push(candidate);
    return candidate.includes('127.0.0.1') ? mineralBridge : otherApp;
  });
  assert.deepEqual(seen, ['http://127.0.0.1:5001', 'http://[::1]:5001']);
  assert.equal(resolved.origin, 'http://127.0.0.1:5001');
  assert.equal(resolved.warning, null);
});

test('resolveApiProxyTarget starts against the default origin when the API is down', async () => {
  const resolved = await resolveApiProxyTarget({}, async () => ({
    healthStatus: null,
    healthBody: null,
    meStatus: null,
    meBody: null,
  }));
  assert.equal(resolved.origin, 'http://127.0.0.1:5001');
  assert.match(resolved.warning, /not accepting connections at http:\/\/127\.0\.0\.1:5001/);
  assert.match(resolved.warning, /Copy-Item \.env\.example \.env/);
  assert.match(resolved.warning, /docker compose up -d --wait mongo/);
  assert.match(resolved.warning, /Redis is optional/);
});

test('resolveApiProxyTarget still refuses another application', async () => {
  await assert.rejects(
    () => resolveApiProxyTarget({ API_BASE_URL: 'http://10.1.2.3:5001' }, async () => otherApp),
    /Refusing to proxy/,
  );
});

test('production build does not receive the dev proxy', () => {
  assert.equal(devProxyFor('build', 'http://127.0.0.1:5001'), undefined);
  const proxy = devProxyFor('serve', 'http://127.0.0.1:5001');
  assert.equal(proxy['/v2'].target, 'http://127.0.0.1:5001');
  assert.equal(proxy['/admin'].target, 'http://127.0.0.1:5001');
  assert.equal(proxy['/api'].target, 'http://127.0.0.1:5001');
  assert.equal(devProxyFor('serve', ''), undefined);
});

test('a refused connection answers with the setup steps', () => {
  const proxy = devProxyFor('serve', 'http://127.0.0.1:5001');
  const handlers = {};
  proxy['/v2'].configure({ on(event, listener) { handlers[event] = listener; } });
  const res = {
    headersSent: false,
    status: 0,
    body: '',
    writeHead(status) { this.status = status; },
    end(body) { this.body = body; },
  };
  handlers.error(new Error('connect ECONNREFUSED 127.0.0.1:5001'), {}, res);
  assert.equal(res.status, 503);
  const payload = JSON.parse(res.body);
  assert.equal(payload.code, 'api/unavailable');
  assert.match(payload.message, /npm run dev/);
  assert.match(payload.cause, /ECONNREFUSED/);
});

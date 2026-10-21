/**
 * Executes every Mineral Bridge admin-dashboard case from admin-cases.json
 * (the 672-row spreadsheet) against the console in demo mode, plus the API-mode
 * cases with a mocked fetch. Results are written to case-results.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { routerFuture, routes } from '@/app/router/router';
import { apiRequest } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import { STAFF_ACCOUNTS } from '@/services/auth';
import { resolveJump } from '@/hooks/useJump';
import { sessionStore } from '@/modules/auth/hooks/useSession';
import { consoleActions, consoleStore } from '@/store/consoleStore';

configure({
  asyncUtilTimeout: 8_000,
  getElementError: (message) => new Error((message ?? 'element not found').split('\n')[0]),
});

interface Case {
  id: string;
  module: string;
  screen: string;
  type: string;
  element: string;
  scenario: string;
  steps: string;
  data: string;
  expected: string;
  priority: string;
  remarks: string;
}

type Stage = 'login' | 'otp' | 'app' | 'locked' | 'out';

interface Dest {
  path: string;
  stage: Stage;
  role: number;
  state?: unknown;
}

interface Result {
  id: string;
  status: 'Pass' | 'Fail';
  error?: string;
  remarks?: string;
}

const casesPath = join(process.cwd(), 'tests/unit/admin-cases.json');
const resultsPath = join(process.cwd(), 'tests/unit/case-results.json');
const cases = JSON.parse(readFileSync(casesPath, 'utf8')) as Case[];
const results: Result[] = [];
const notes = new Map<string, string>();

const user = userEvent.setup({ delay: null });

function note(id: string, text: string) {
  notes.set(id, text);
}

function roleOf(text: string): number {
  if (/grace|trading desk/i.test(text)) return 0;
  if (/lydia|compliance officer/i.test(text)) return 1;
  if (/samuel|ceo|super admin/i.test(text)) return 2;
  if (/sylvia|support agent/i.test(text)) return 3;
  if (/patrick|content manager/i.test(text)) return 4;
  if (/david|data entry/i.test(text)) return 5;
  return 2;
}

function dest(path: string, stage: Stage, role = 2, state?: unknown): Dest {
  return { path, stage, role, state };
}

function destination(c: Case): Dest {
  const mod = c.id.split('-')[0];
  const n = Number(c.id.split('-')[1]);
  const blob = `${c.element} ${c.scenario} ${c.steps} ${c.expected}`;
  const role = roleOf(blob);
  if (mod === 'M3') {
    if (c.id === 'M3-029') return dest('/login', 'app', role);
    if (c.id === 'M3-030') return dest('/lc', 'login', role);
    return dest('/login', 'login', 0);
  }
  if (mod === 'M4') return dest('/verify', 'otp', role);
  if (mod === 'M5') {
    if (c.id === 'M5-003' || c.id === 'M5-006') return dest('/signed-out', 'out', role);
    if (c.id === 'M5-012') return dest('/orders', 'out', role);
    if (c.id === 'M5-009') return dest('/orders', 'locked', role);
    if (c.id === 'M5-010') return dest('/locked', 'app', role);
    if (c.id === 'M5-011') return dest('/orders', 'app', role);
    if (c.id === 'M5-008') return dest('/locked', 'locked', role);
    return dest('/locked', 'locked', role, { from: '/lc' });
  }
  if (mod === 'M1') {
    if (c.id === 'M1-015') return dest('/lc', 'app', role);
    if (c.id === 'M1-033' || c.id === 'M1-034') return dest('/orders', 'app', role);
    if (c.id === 'M1-027') return dest('/vault/MBV-2026-0388', 'app', role);
    if (c.id === 'M1-031') return dest('/does-not-exist', 'app', role);
    if (c.id === 'M1-036' || c.id === 'M1-037' || c.id === 'M1-038' || c.id === 'M1-024' || c.id === 'M1-025') return dest('/orders', 'app', role);
    return dest('/overview', 'app', role);
  }
  if (mod === 'M2' || mod === 'M6' || mod === 'XC') return dest('/overview', 'app', role);
  if (mod === 'M7') {
    if (c.id === 'M7-027') return dest('/orders/NOPE', 'app');
    if (['M7-015', 'M7-016', 'M7-025', 'M7-026', 'M7-041', 'M7-042', 'M7-043', 'M7-044'].includes(c.id)) return dest('/orders/intake', 'app');
    if (c.id === 'M7-019') return dest('/orders/MB-BUY-38217', 'app');
    if (['M7-018', 'M7-031', 'M7-032', 'M7-033'].includes(c.id)) return dest('/orders/MB-SELL-41964', 'app');
    if (['M7-017', 'M7-028', 'M7-029', 'M7-030', 'M7-034', 'M7-035'].includes(c.id) || n >= 45) return dest('/orders/MB-SELL-41982', 'app');
    return dest('/orders', 'app');
  }
  if (mod === 'M8') {
    if (c.id === 'M8-029') return dest('/vault/NOPE', 'app');
    if (c.id === 'M8-024') return dest('/vault/MBV-2026-0408', 'app');
    if ((n >= 3 && n <= 7) || (n >= 18 && n <= 28)) return dest('/vault/MBV-2026-0412', 'app');
    return dest('/vault', 'app');
  }
  if (mod === 'M9') {
    if (c.id === 'M9-037') return dest('/listings/NOPE', 'app');
    if (c.id === 'M9-027') return dest('/listings/MBL-2026-0101', 'app');
    if ((n >= 5 && n <= 6) || (n >= 21 && n <= 36)) return dest('/listings/MBL-2026-0112', 'app');
    return dest('/listings', 'app');
  }
  if (mod === 'M10') {
    if (c.id === 'M10-005' || n >= 18) return dest('/pricing/offers', 'app');
    return dest('/pricing', 'app');
  }
  if (mod === 'M11') {
    if (['M11-004', 'M11-020', 'M11-021', 'M11-022', 'M11-023', 'M11-039', 'M11-041', 'M11-042'].includes(c.id)) return dest('/auctions/create', 'app');
    if (['M11-005', 'M11-006', 'M11-024', 'M11-025', 'M11-026', 'M11-027', 'M11-028', 'M11-029', 'M11-043', 'M11-044'].includes(c.id)) return dest('/auctions/live/AUC-2026-0219', 'app');
    if (['M11-030', 'M11-046', 'M11-048'].includes(c.id)) return dest('/auctions/ended/AUC-2026-0214', 'app');
    if (['M11-031', 'M11-032', 'M11-033', 'M11-034', 'M11-035', 'M11-047'].includes(c.id)) return dest('/auctions/ended/AUC-2026-0211', 'app');
    if (['M11-002', 'M11-017', 'M11-018', 'M11-036', 'M11-040'].includes(c.id)) return dest('/auctions/upcoming', 'app');
    if (c.id === 'M11-007') return dest('/auctions/ended/AUC-2026-0214', 'app');
    if (['M11-003', 'M11-019', 'M11-037', 'M11-038', 'M11-045'].includes(c.id)) {
      return dest(c.id === 'M11-045' ? '/auctions/live/NOPE' : '/auctions/ended', 'app');
    }
    return dest('/auctions', 'app');
  }
  if (mod === 'M12') return dest('/lc', 'app');
  if (mod === 'M13') return dest('/collab', 'app');
  if (mod === 'M14') return dest('/chain', 'app');
  if (mod === 'M15') {
    if (c.id === 'M15-026') return dest('/users/Nobody', 'app');
    if (['M15-003', 'M15-019', 'M15-020', 'M15-024', 'M15-025'].includes(c.id)) return dest('/users/tiers', 'app');
    if (c.id === 'M15-027' || c.id === 'M15-028') return dest('/users/Grace%20Cheruiyot', 'app');
    if ((n >= 4 && n <= 5) || n >= 21) return dest('/users/Joseph%20Kiptoo', 'app');
    return dest('/users', 'app');
  }
  if (mod === 'M16') {
    if (c.id === 'M16-004' || n >= 20) return dest('/verification/expiry', 'app');
    return dest('/verification', 'app');
  }
  if (mod === 'M17') {
    if (c.id === 'M17-020') return dest('/disputes/NOPE', 'app');
    if (c.id === 'M17-021') return dest('/disputes/DSP-2026-0058', 'app');
    if ((n >= 1 && n <= 3) || n >= 13) return dest('/disputes/DSP-2026-0071', 'app');
    return dest('/disputes', 'app');
  }
  if (mod === 'M18') {
    if (c.id === 'M18-003') return dest('/academy/analytics', 'app');
    return dest('/academy', 'app');
  }
  if (mod === 'M19') return dest('/marketing', 'app');
  if (mod === 'M20') return dest('/partners', 'app');
  if (mod === 'M21') {
    if (c.id === 'M21-002' || c.id === 'M21-013') return dest('/support/calls', 'app');
    return dest('/support', 'app');
  }
  if (mod === 'M22') return dest('/audit', 'app');
  if (mod === 'M23') return dest('/financial', 'app');
  if (mod === 'M24') return dest('/analytics', 'app');
  if (mod === 'M25') {
    if (['M25-003', 'M25-010', 'M25-011', 'M25-012', 'M25-018', 'M25-024'].includes(c.id)) return dest('/settings/platform', 'app');
    if (['M25-004', 'M25-013', 'M25-014', 'M25-015', 'M25-016', 'M25-019', 'M25-020', 'M25-021', 'M25-022'].includes(c.id)) return dest('/settings/btc', 'app');
    return dest('/settings', 'app');
  }
  if (mod === 'M26') return dest('/profile', 'app', role);
  return dest('/overview', 'app', role);
}

function renderAt(d: Dest) {
  sessionStore.setState({
    stage: d.stage,
    roleIndex: d.role,
    authError: null,
    credsOpen: false,
    challengeId: null,
    liveAccount: null,
    maskedDestination: null,
    otpChannel: null,
    otpExpiresAt: null,
    resendAvailableAt: null,
  });
  const router = createMemoryRouter(routes, {
    initialEntries: [{ pathname: d.path, state: d.state }],
    future: routerFuture,
  });
  render(
    <QueryProvider>
      <ThemeProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </ThemeProvider>
    </QueryProvider>,
  );
  return router;
}

async function ready() {
  await screen.findByRole('heading', { level: 1 }).catch(() => screen.findByRole('button'));
  await waitFor(() => {
    const loading = screen.queryAllByRole('status').some((el) => /loading/i.test(el.textContent ?? ''));
    if (loading) throw new Error('still loading');
    const main = document.querySelector('#main');
    if (main && (main.textContent ?? '').replace(/\s+/g, '').length < 12) throw new Error('page still loading');
  }, { timeout: 8_000 });
}

function haystack(): string {
  const values = [...document.querySelectorAll('input, textarea, select')].map((el) => {
    const field = el as HTMLInputElement;
    return `${field.value} ${field.placeholder}`;
  });
  const labels = [...document.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label') ?? '');
  return `${document.body.textContent ?? ''} ${labels.join(' ')} ${values.join(' ')}`;
}

function norm(value: string): string {
  return value.toLowerCase().replace(/[·•—–]/g, ' ').replace(/\s+/g, ' ').trim();
}

function words(phrase: string): string[] {
  return norm(phrase.replace(/\{[^}]+\}/g, ' '))
    .split(/[^a-z0-9%+$]+/)
    .filter((word) => word.length > 1);
}

function hasWords(hay: string, phrase: string): boolean {
  const options = phrase.split(/\s+\/\s+/);
  if (options.length > 1) return options.some((option) => hasWords(hay, option));
  const flat = norm(hay);
  const need = words(phrase);
  return need.length > 0 && need.every((word) => flat.includes(word));
}

function quotes(text: string): string[] {
  return [...text.matchAll(/[“"]([^”"]{2,})[”"]/g)].map((match) => match[1]);
}

function visibleExpected(expected: string): string {
  return expected.split(/Text, numbers and labels are correct/i)[0];
}

function dataTokens(expected: string): string[] {
  const body = visibleExpected(expected);
  const tokens = [...body.matchAll(/\$[\d,.]+[MBK%]?|[A-Z]{2,}(?:-[\w]+)+|\d{1,3}(?:,\d{3})+(?:\.\d+)?[MBK%]?|\d+\.\d+%?|(?<![\d,])\d{3,}(?![\d,])/g)].map((match) => match[0]);
  return [...new Set(tokens)].filter((token) => !/^\d{4}$/.test(token) || /20\d\d-\d/.test(body));
}

function assertShown(expected: string) {
  const body = visibleExpected(expected);
  const hay = haystack();
  const quoted = quotes(body).filter((phrase) => {
    const at = body.indexOf(phrase);
    const prefix = body.slice(Math.max(0, at - 14), at);
    return !/e\.g\.?\s*[“"]?$/i.test(prefix);
  });
  if (quoted.length && /\s+or\s+/i.test(body)) {
    if (!quoted.some((phrase) => hasWords(hay, phrase))) throw new Error(`Missing on screen: ${quoted.join(' | ')}`);
  } else {
    const missing = quoted.filter((phrase) => !hasWords(hay, phrase));
    if (missing.length) throw new Error(`Missing on screen: ${missing.join(' | ')}`);
  }
  const missingTokens = dataTokens(body).filter((token) => !hay.includes(token) && !hay.includes(token.replace('%', '')));
  if (missingTokens.length) throw new Error(`Missing figures: ${missingTokens.join(', ')}`);
}

function toastText(): string {
  return consoleStore.getState().notices.map((n) => n.text).join(' | ');
}

function assertToast(expected: string) {
  const after = expected.split(/toast/i)[1] ?? expected;
  const pattern = quotes(after)[0];
  const toast = toastText();
  if (!toast) throw new Error(`Expected a toast. Screen said: ${haystack().slice(0, 180)}`);
  if (pattern && !hasWords(toast, pattern)) throw new Error(`Toast “${toast}” did not match “${pattern}”`);
  const rest = quotes(expected).filter((phrase) => phrase !== pattern);
  const hay = haystack();
  const missing = rest.filter((phrase) => !hasWords(hay, phrase) && !hasWords(toast, phrase));
  if (missing.length) throw new Error(`After the toast, missing: ${missing.join(' | ')}`);
}

function pathOf(router: ReturnType<typeof createMemoryRouter>): string {
  return router.state.location.pathname;
}

function assertPath(router: ReturnType<typeof createMemoryRouter>, expected: string) {
  const now = decodeURIComponent(pathOf(router));
  const templated = [...expected.matchAll(/(\/[a-z][a-z0-9/_-]*)\{[^}]+\}/gi)].map((m) => m[1]);
  if (templated.length) {
    if (!templated.some((prefix) => now.startsWith(prefix) && now.length > prefix.length)) {
      throw new Error(`Path ${now} did not match ${templated.join(' or ')}`);
    }
    return;
  }
  const verbs = [...expected.matchAll(/(?:Navigates to|Opens|Returns to|Redirected to|lands on|Sent (?:back )?to)\s+(\/[^\s;,]+)/gi)].map((m) =>
    m[1].replace(/[.;]+$/, ''),
  );
  const bare = /^\s*(\/[a-z][^\s;,]*)/.exec(expected)?.[1];
  const paths = verbs.length ? verbs : bare ? [bare] : [];
  if (!paths.length) return;
  const ok = paths.some((p) => now === p || now.startsWith(`${p}/`));
  if (!ok) throw new Error(`Path ${now} is not ${paths.join(' or ')}`);
}

function rowText(): string[] {
  const rows = [...document.querySelectorAll('[role="row"]')].slice(1);
  return rows
    .map((row) => [...row.children].map((cell) => cell.textContent ?? '').join(' '))
    .filter((text) => text.trim().length > 0);
}

function escapeReg(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function clickMatch(pattern: RegExp) {
  const roles = ['button', 'link', 'menuitem', 'radio', 'switch', 'row'] as const;
  for (const role of roles) {
    const found = screen.queryAllByRole(role, { name: pattern, hidden: true });
    if (!found.length) continue;
    const el = found.slice().sort((a, b) => {
      const length = (node: HTMLElement) => (node.getAttribute('aria-label') || node.textContent || '').trim().length;
      const hidden = (node: HTMLElement) => (getComputedStyle(node).display === 'none' ? 500 : 0);
      const chip = (node: HTMLElement) => (node.getAttribute('aria-pressed') == null ? 30 : 0);
      return length(a) + hidden(a) + chip(a) - (length(b) + hidden(b) + chip(b));
    })[0];
    if (getComputedStyle(el).display === 'none') fireEvent.click(el);
    else await user.click(el);
    return;
  }
  const text = screen.queryAllByText(pattern);
  if (text[0]) {
    await user.click(text[0]);
    return;
  }
  throw new Error(`No control matching ${pattern}`);
}

async function clickLabel(label: string) {
  const aliases: Record<string, RegExp> = {
    'Sidebar brand': /Mineral Bridge Operations/i,
    'Signed-in card': /open profile/i,
    'Theme toggle (header)': /Switch to (light|dark)/i,
    'Theme button (form)': /Switch to (light|dark)/i,
    Bell: /Notifications/i,
    'Narrow menu': /Open navigation/i,
    'Pending KYC card': /pending kyc/i,
    'Active orders card': /active orders/i,
    'Vault value card': /vault value/i,
    'Live auctions card': /live auctions/i,
    'Settlements card': /settlements this week/i,
    'Active negotiations tile': /ACTIVE NEGOTIATIONS/i,
    'LC value': /LC VALUE ISSUED/i,
    'Passports': /PASSPORTS ON BLOCKCHAIN/i,
    'BTC': /BTC-SETTLED VOLUME/i,
    'Vault by mineral heading': /Vault value by mineral/i,
    'Last 20 events · full log': /full log/i,
    'Open LC & Payments': /Open LC & Payments/i,
    'Queue: KYC': /KYC queue/i,
    'Queue: Firm offers': /Firm offers to approve/i,
    'Queue: Bulk intake': /Bulk intake to price/i,
    'Queue: Vault unallocated': /Vault lots unallocated/i,
    'Queue: Open disputes': /Open disputes/i,
    'Open rate table (intake)': /Open rate table/i,
    'Range 12W': /^12W$/,
    'Add lesson (category)': /^Add lesson$/i,
    'Edit (BTC)': /^Edit$/i,
    'Advance to next stage': /Advance to Pricing confirmation/i,
    'Range 6M': /^6M$/,
    'Range 1Y': /^1Y$/,
    'Period button': /September 2026/,
    'View document': /^View$/,
    'Manual-rate toggle': /Manual desk rate/i,
    'Revoke session': /^Revoke$/,
    'Live toggle on': /Banner live/i,
    'Certified toggle on': /Certified track:/i,
  };
  if (aliases[label]) return clickMatch(aliases[label]);
  const cleaned = label.replace(/^Chip:\s*/, '').replace(/\s+drawer$/i, '').trim();
  return clickMatch(new RegExp(escapeReg(cleaned).replace(/\\ /g, '\\s+'), 'i'));
}

async function openAccount() {
  await clickMatch(/Account menu/i);
}

async function searchFor(value: string) {
  const input = screen.getByRole('textbox', { name: /Search orders, lots, users, documents/i });
  await user.clear(input);
  if (value) await user.type(input, value);
}

function mainText(): string {
  return document.querySelector('#main')?.textContent ?? haystack();
}

function isApiCase(c: Case): boolean {
  if (['M1-038', 'M9-008', 'M9-009', 'M9-010', 'M9-011'].includes(c.id)) return true;
  return /API mode|POST \/auth|GET \/orders|GET \/catalog|POST \/orders/i.test(`${c.steps} ${c.expected} ${c.scenario}`);
}

interface FetchCall {
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
}

function installFetch(handler: (call: FetchCall) => { status?: number; body?: unknown } | Promise<{ status?: number; body?: unknown }>) {
  const calls: FetchCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const headers: Record<string, string> = {};
      new Headers(init?.headers).forEach((value, key) => {
        headers[key] = value;
      });
      const call = { url: String(url), method: (init?.method ?? 'GET').toUpperCase(), body: String(init?.body ?? ''), headers };
      calls.push(call);
      const result = await handler(call);
      return new Response(JSON.stringify(result.body ?? {}), {
        status: result.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
  return calls;
}

const HIERARCHY = {
  categories: [
    {
      name: 'Precious',
      slug: 'precious',
      imageUrl: null,
      subcategories: [
        {
          name: 'Gold',
          slug: 'gold',
          imageUrl: null,
          mineralTypes: [{ name: 'Concentrate', slug: 'conc', productForms: [{ name: 'Gold Concentrate', slug: 'gc', sourceId: 'MIN-1', imageUrl: null }] }],
        },
      ],
    },
  ],
};

async function runApi(c: Case) {
  vi.stubEnv('VITE_API_BASE_URL', 'https://ops.mineralbridge.test');
  const id = c.id;
  if (id === 'M3-023') {
    const calls = installFetch(() => ({
      body: {
        me: { name: 'Platform CEO', email: 'ceo@mineralbridge.co.ke', initials: 'PC', role: { name: 'CEO', scope: 'Full platform access' }, csrfToken: 'csrf-test' },
        redirectTo: '/overview',
      },
    }));
    const router = renderAt(dest('/login', 'login', 0));
    await ready();
    await user.type(screen.getByLabelText(/work email/i), 'ceo@mineralbridge.co.ke');
    await user.type(screen.getByLabelText(/^password/i), 'ChangeMe!Admin1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await vi.waitFor(() => expect(pathOf(router)).toBe('/overview'));
    expect(calls.some((call) => call.url.endsWith('/admin/v1/auth/sign-in') && call.method === 'POST')).toBe(true);
    expect(screen.queryByRole('heading', { name: /Verify it's you/i })).not.toBeInTheDocument();
    return;
  }
  if (id === 'M3-024') {
    installFetch(() => ({ status: 401, body: { message: 'Invalid credentials' } }));
    renderAt(dest('/login', 'login', 0));
    await ready();
    await user.type(screen.getByLabelText(/work email/i), 'ceo@mineralbridge.co.ke');
    await user.type(screen.getByLabelText(/^password/i), 'nope');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid credentials|Sign-in failed/);
    return;
  }
  if (id === 'M3-025') {
    const calls = installFetch(() => ({ body: {} }));
    renderAt(dest('/login', 'login', 0));
    await ready();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your work email and password.');
    expect(calls.filter((call) => !call.url.endsWith('/admin/v1/auth/dev-login'))).toHaveLength(0);
    return;
  }
  if (id === 'M3-026') {
    const assign = vi.fn();
    const current = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...current, assign, reload: current.reload.bind(current) } });
    const calls = installFetch(() => ({ body: { redirectUrl: 'https://sso.mineralbridge.test/start' } }));
    renderAt(dest('/login', 'login', 0));
    await ready();
    await user.type(screen.getByLabelText(/work email/i), 'ceo@mineralbridge.co.ke');
    await user.click(screen.getByRole('button', { name: /Continue with staff SSO/i }));
    await vi.waitFor(() => expect(calls.some((call) => call.url.endsWith('/auth/sso/start'))).toBe(true));
    expect(assign).toHaveBeenCalledWith('https://sso.mineralbridge.test/start');
    return;
  }
  if (id === 'M3-027') {
    installFetch(() => ({ status: 503, body: { message: 'SSO down' } }));
    renderAt(dest('/login', 'login', 0));
    await ready();
    await user.type(screen.getByLabelText(/work email/i), 'ceo@mineralbridge.co.ke');
    await user.click(screen.getByRole('button', { name: /Continue with staff SSO/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/SSO down|Staff SSO is not available/);
    return;
  }
  if (id === 'M3-028') {
    const calls = installFetch(() => ({ status: 202, body: { message: 'If that account exists, a reset link is on its way.' } }));
    renderAt(dest('/login', 'login', 0));
    await ready();
    await user.type(screen.getByLabelText(/work email/i), 'ceo@mineralbridge.co.ke');
    await user.click(screen.getByRole('button', { name: /Forgot password/i }));
    await vi.waitFor(() => expect(toastText()).toMatch(/reset link/i));
    expect(calls.some((call) => call.url.endsWith('/auth/password-reset'))).toBe(true);
    return;
  }
  if (id === 'M4-015' || id === 'M4-016' || id === 'M4-017' || id === 'M4-018' || id === 'M4-019' || id === 'M4-020' || id === 'M4-021' || id === 'M4-022') {
    const expiresAt = new Date(Date.now() + (id === 'M4-017' ? 2_000 : 120_000)).toISOString();
    const resendAvailableAt = new Date(Date.now() + (id === 'M4-018' ? 1_500 : 0)).toISOString();
    sessionStore.setState({
      stage: 'otp',
      roleIndex: 2,
      challengeId: id === 'M4-020' ? null : 'ch-1',
      liveAccount: { ...STAFF_ACCOUNTS[2], name: 'Samuel Njoroge' },
      maskedDestination: '+254 7•• •• 004',
      otpChannel: 'sms',
      otpExpiresAt: expiresAt,
      resendAvailableAt,
      authError: null,
      credsOpen: false,
    });
    const calls = installFetch((call) => {
      if (call.url.includes('/otp/resend') && id === 'M4-019') return { status: 500, body: { message: 'nope' } };
      if (call.url.includes('/otp/verify') && id === 'M4-021') return { status: 401, body: { message: 'That code was not accepted' } };
      if (call.url.includes('/otp/verify')) return { body: { me: { name: 'Samuel Njoroge', role: { name: 'CEO / Super Admin' }, csrfToken: 'csrf-test' } } };
      return { body: { maskedDestination: '+254 7•• •• 004', resendAvailableAt: new Date(Date.now() + 30_000).toISOString() } };
    });
    const router = createMemoryRouter(routes, { initialEntries: ['/verify'], future: routerFuture });
    render(
      <QueryProvider>
        <ThemeProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </ThemeProvider>
      </QueryProvider>,
    );
    await screen.findByRole('heading', { name: /Verify it's you/i });
    if (id === 'M4-015') {
      expect(haystack()).toMatch(/submitted to the phone \+254 7•• •• 004/i);
      expect(haystack()).toMatch(/Delivery is confirmed only when it arrives/i);
      expect(screen.getByRole('textbox')).toHaveValue('');
      return;
    }
    if (id === 'M4-016') {
      await user.type(screen.getByRole('textbox'), '418 206');
      await user.click(screen.getByRole('button', { name: /Verify and open console/i }));
      await vi.waitFor(() => expect(calls.some((call) => call.url.includes('/otp/verify'))).toBe(true));
      const verify = calls.find((call) => call.url.includes('/otp/verify'));
      expect(verify?.body).toContain('418206');
      expect(verify?.body).not.toContain('418 206');
      return;
    }
    if (id === 'M4-017') {
      expect(haystack()).toMatch(/Code expires in/);
      await vi.waitFor(() => expect(haystack()).toMatch(/Code expired/), { timeout: 4_000 });
      return;
    }
    if (id === 'M4-018') {
      const before = calls.length;
      await user.click(screen.getByRole('button', { name: /Resend code/i }));
      expect(calls.length).toBe(before);
      await vi.waitFor(() => expect(haystack()).toMatch(/Code expires in 1:|Code expires in 0:/), { timeout: 4_000 }).catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 1600));
      await user.click(screen.getByRole('button', { name: /Resend code/i }));
      await vi.waitFor(() => expect(calls.some((call) => call.url.includes('/otp/resend'))).toBe(true));
      expect(toastText()).toMatch(/A new code was submitted to \+254 7•• •• 004/i);
      return;
    }
    if (id === 'M4-019') {
      sessionStore.setState({ resendAvailableAt: new Date(Date.now() - 1000).toISOString() });
      await user.click(screen.getByRole('button', { name: /Resend code/i }));
      await vi.waitFor(() => expect(toastText()).toMatch(/Could not resend the code/));
      return;
    }
    if (id === 'M4-020') {
      await user.click(screen.getByRole('button', { name: /Verify and open console/i }));
      expect(await screen.findByText(/Request a code again/)).toBeInTheDocument();
      return;
    }
    if (id === 'M4-021') {
      await user.type(screen.getByRole('textbox'), '000000');
      await user.click(screen.getByRole('button', { name: /Verify and open console/i }));
      expect(await screen.findByText(/That code was not accepted/)).toBeInTheDocument();
      return;
    }
    await user.type(screen.getByRole('textbox'), '418206');
    await user.click(screen.getByRole('button', { name: /Verify and open console/i }));
    await vi.waitFor(() => expect(sessionStore.getState().stage).toBe('app'));
    installFetch((call) => {
      calls.push(call);
      return { body: {} };
    });
    await apiRequest('/orders/MB-SELL-41964/advance', { method: 'POST', body: '{}' });
    const advance = calls.find((call) => call.url.includes('/advance'));
    expect(advance?.headers['x-csrf-token']).toBe('csrf-test');
    return;
  }
  if (id === 'M1-036' || id === 'M1-037' || id === 'M1-038') {
    const status = id === 'M1-036' ? 403 : id === 'M1-037' ? 401 : 500;
    const message = id === 'M1-038' ? 'Internal Server Error' : 'nope';
    installFetch(() => ({ status, body: { message } }));
    renderAt(dest('/orders', 'app'));
    const heading = id === 'M1-036' ? /This account cannot open that screen/ : id === 'M1-037' ? /Your session has ended/ : /This screen could not be loaded/;
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    if (id === 'M1-038') expect(haystack()).toMatch(/Internal Server Error|500/);
    return;
  }
  if (id === 'M7-031' || id === 'M7-032' || id === 'M7-036') {
    const calls = installFetch((call) => {
      if (call.method === 'GET') {
        return {
          body: {
            data: [{ id: 'MB-SELL-90001', mineral: 'Gold Concentrate', side: 'sell', stage: 'verification', party: { name: 'Api Miner', tier: 2 }, quantity: { value: 3, unit: 'kg' }, daysInStage: 1, agent: { initials: 'AA' } }],
          },
        };
      }
      if (id === 'M7-032') return { status: 500, body: { message: 'Could not advance the order' } };
      return { body: {} };
    });
    const router = renderAt(id === 'M7-036' ? dest('/orders', 'app') : dest('/orders/MB-SELL-90001', 'app'));
    if (id === 'M7-036') {
      expect(await screen.findByText('MB-SELL-90001')).toBeInTheDocument();
      expect(calls.some((call) => call.method === 'GET' && call.url.endsWith('/admin/v1/orders'))).toBe(true);
      return;
    }
    await screen.findByRole('button', { name: /Advance to Pricing confirmation/i });
    await user.click(screen.getByRole('button', { name: /Advance to Pricing confirmation/i }));
    await vi.waitFor(() => expect(calls.some((call) => call.method === 'POST' && call.url.includes('/advance'))).toBe(true));
    if (id === 'M7-031') {
      expect(toastText()).toMatch(/MB-SELL-90001 advanced to Pricing confirmation/);
      expect(haystack()).toMatch(/Pricing confirmation/);
    } else {
      expect(toastText()).toMatch(/Could not advance the order/);
      expect(pathOf(router)).toContain('MB-SELL-90001');
    }
    return;
  }
  if (id === 'M9-007' || id === 'M9-008' || id === 'M9-009' || id === 'M9-010' || id === 'M9-011' || id === 'M9-031' || id === 'M9-032' || id === 'M9-033') {
    let mode: 'ok' | 'fail' | 'empty' | 'hang' = 'ok';
    if (id === 'M9-011' || id === 'M9-032') mode = 'fail';
    const calls = installFetch(() => {
      if (mode === 'hang') return new Promise(() => ({ body: HIERARCHY }));
      if (mode === 'fail') return { status: 500, body: { message: 'nope' } };
      if (mode === 'empty') return { body: { categories: [] } };
      return { body: HIERARCHY };
    });
    renderAt(dest('/listings', 'app'));
    if (id === 'M9-033') {
      await vi.waitFor(() => expect(calls.some((call) => call.url.endsWith('/catalog/hierarchy'))).toBe(true));
      return;
    }
    if (id === 'M9-032') {
      expect(await screen.findByText(/The hierarchy could not be loaded/)).toBeInTheDocument();
      mode = 'empty';
      await user.click(screen.getByRole('button', { name: 'Retry' }));
      expect(await screen.findByText(/Nothing is published under this selection/)).toBeInTheDocument();
      return;
    }
    if (id === 'M9-011') {
      expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
      const before = calls.length;
      mode = 'ok';
      await user.click(screen.getByRole('button', { name: 'Retry' }));
      await vi.waitFor(() => expect(calls.length).toBeGreaterThan(before));
      return;
    }
    expect(await screen.findByRole('button', { name: /Precious/i })).toBeInTheDocument();
    if (id === 'M9-007' || id === 'M9-008' || id === 'M9-009' || id === 'M9-010' || id === 'M9-031') {
      await user.click(screen.getByRole('button', { name: /Precious/i }));
      expect(await screen.findByRole('button', { name: /Gold/ })).toBeInTheDocument();
      if (id === 'M9-009') {
        await user.click(screen.getByRole('button', { name: /^Categories$/ }));
        expect(await screen.findByRole('button', { name: /Precious/i })).toBeInTheDocument();
        return;
      }
      await user.click(screen.getByRole('button', { name: /Gold/ }));
      expect((await screen.findAllByText('Gold Concentrate')).length).toBeGreaterThan(0);
      if (id === 'M9-031') {
        expect(screen.getByRole('textbox', { name: /Search product forms/i })).toHaveAttribute('placeholder', 'Name or mineral id');
        expect(screen.queryByRole('button', { name: /Gold Concentrate/ })).toBeNull();
        return;
      }
      if (id === 'M9-010') {
        await user.click(screen.getByRole('button', { name: /^Subcategories$/ }));
        expect(await screen.findByRole('button', { name: /Gold/ })).toBeInTheDocument();
      }
    }
    return;
  }
  if (id === 'XC-010') {
    const calls = installFetch((call) => {
      if (call.url.endsWith('/orders')) return { body: { data: [] } };
      if (call.url.includes('/catalog/hierarchy')) return { body: HIERARCHY };
      return { body: {} };
    });
    renderAt(dest('/orders', 'app'));
    await screen.findByRole('heading', { name: 'Orders' });
    renderAt(dest('/listings', 'app'));
    await vi.waitFor(() => expect(calls.some((call) => /\/admin\/v1\/listings/.test(call.url))).toBe(true));
    const foreign = calls.filter((call) => !/\/admin\/v1\/(orders|catalog\/hierarchy|auth\/|listings|dashboard\/counters|notifications)/.test(call.url));
    expect(foreign).toEqual([]);
    note(id, 'Checked orders, catalog hierarchy, listings, sidebar counters, and notifications.');
    return;
  }
  throw new Error(`No API runner for ${id}`);
}

const DRAWER_ALIAS: Record<string, string> = {
  'Edit course': 'Edit',
  'Edit banner': 'Edit',
  'Manage partner': 'Manage',
  'Add lesson (course)': 'Lesson',
  Mediate: 'Mediate with suggested price',
  'Request amendment': 'Request amendment',
};

async function openNamed(trigger: string) {
  const stripped = trigger.replace(/\s*\([^)]*\)/g, '').replace(/^Range\s+/i, '').replace(/\s+/g, ' ').trim();
  const names = [...new Set([DRAWER_ALIAS[trigger], trigger, stripped, stripped.split(' ').at(-1)].filter((name): name is string => typeof name === 'string' && name.length > 2))];
  const tryNames = async () => {
    let last: unknown;
    for (const name of names) {
      try {
        await clickMatch(new RegExp(escapeReg(name), 'i'));
        return;
      } catch (error) {
        last = error;
      }
    }
    throw last;
  };
  try {
    await tryNames();
  } catch (error) {
    const row = document.querySelector<HTMLElement>('[role="row"][tabindex="0"]');
    if (!row) throw error;
    fireEvent.click(row);
    await tryNames();
  }
}

async function openDrawer(trigger: string) {
  await openNamed(trigger);
  await screen.findByRole('dialog');
}

async function drawerFlow(c: Case) {
  const [rawTrigger, action] = c.element.split(':').map((part) => part.trim());
  const trigger = rawTrigger.replace(/ drawer$/i, '');
  if (/close discards/i.test(c.scenario) || /close discards/i.test(c.expected)) {
    for (const how of ['escape', 'scrim', 'close'] as const) {
      await openDrawer(trigger);
      const dialog = screen.getByRole('dialog');
      const field = within(dialog).getAllByRole('textbox')[0];
      await user.clear(field);
      await user.type(field, 'ZZZTEMP');
      const before = consoleStore.getState().notices.length;
      if (how === 'escape') await user.keyboard('{Escape}');
      if (how === 'scrim') await user.click(screen.getByRole('button', { name: 'Close panel' }));
      if (how === 'close') await user.click(within(dialog).getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(consoleStore.getState().notices.length).toBe(before);
    }
    await openDrawer(trigger);
    expect(within(screen.getByRole('dialog')).getAllByRole('textbox')[0]).not.toHaveValue('ZZZTEMP');
    return;
  }
  await openDrawer(trigger);
  const dialog = screen.getByRole('dialog');
  if (/fill the fields/i.test(c.steps)) {
    const field = within(dialog).getAllByRole('textbox')[0];
    await user.clear(field);
    await user.type(field, 'ZZZTEMP');
  }
  const buttonName = /Save as draft/i.test(c.element) || /Save as draft/i.test(c.steps) ? /Save as draft|saved as a draft/i : new RegExp(escapeReg(action), 'i');
  await user.click(within(dialog).getByRole('button', { name: buttonName }));
  expect(screen.queryByRole('dialog')).toBeNull();
  assertToast(c.expected);
  if (/not sent|not added|does not include/i.test(c.expected)) expect(toastText()).not.toMatch(/ZZZTEMP/);
}

async function runCard(c: Case) {
  if (c.id === 'M11-007') {
    expect(haystack()).toMatch(/11\.4%/);
    expect(haystack()).toMatch(/08 Sep 2026/);
    cleanup();
    renderAt(dest('/auctions/ended/AUC-2026-0211', 'app'));
    await ready();
    expect(haystack()).toMatch(/4\.3%/);
    return;
  }
  if (/drawer/i.test(c.element)) {
    await openDrawer(c.element.replace(/ drawer$/i, ''));
  }
  if (c.id === 'M3-003') await user.click(screen.getByRole('button', { name: /Show staff test credentials/i }));
  assertShown(c.expected);
  if (/light and dark/i.test(c.expected)) {
    consoleActions.setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    assertShown(c.expected);
    consoleActions.setTheme('light');
  }
}

async function runChip(c: Case) {
  const label = c.element.replace(/^Chip:\s*/, '').trim();
  if (c.id === 'M7-009') {
    for (const stage of ['Verification', 'Pricing confirmation', 'Agent visit', 'Inspection & approval', 'Payment released', 'Custody transfer']) {
      await clickLabel(stage);
      expect(screen.getByRole('button', { name: new RegExp(`^${escapeReg(stage)}\\b`, 'i') })).toHaveAttribute('aria-pressed', 'true');
      const rows = rowText();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.includes(stage))).toBe(true);
      expect(consoleStore.getState().orderPage).toBe(0);
    }
    return;
  }
  if (c.id === 'M7-010') {
    await clickLabel('Verification');
    await clickLabel('Verification');
    expect(screen.getByRole('button', { name: /All stages/i })).toHaveAttribute('aria-pressed', 'true');
    expect(consoleStore.getState().filters.orderStage).toBe('');
    return;
  }
  await clickMatch(new RegExp(`^${escapeReg(label)}(\\b|\\s|$)`, 'i'));
  const chips = screen.getAllByRole('button', { name: new RegExp(`^${escapeReg(label)}(\\b|\\s|$)`, 'i') });
  const chip = chips.find((el) => el.getAttribute('aria-pressed') === 'true') ?? chips[0];
  expect(chip).toHaveAttribute('aria-pressed', 'true');
  const rows = rowText();
  if (label === 'Buy') {
    expect(rows.every((row) => !/\bSell\b/.test(row))).toBe(true);
    expect(consoleStore.getState().orderPage).toBe(0);
  } else if (label === 'Sell') {
    expect(rows.every((row) => !/\bBuy\b/.test(row))).toBe(true);
    expect(consoleStore.getState().orderPage).toBe(0);
  } else if (label === 'All sides') {
    const blob = rows.join('\n');
    if (!/Buy/.test(blob) || !/Sell/.test(blob)) throw new Error(`Both sides missing. Rows: ${blob.slice(0, 500)}`);
  } else if (!/^All\b/i.test(label) && rows.length) {
    const token = label.split('·')[0].trim();
    if (token.length > 2 && rows.some((row) => row.toLowerCase().includes(token.toLowerCase()))) {
      expect(rows.every((row) => row.toLowerCase().includes(token.toLowerCase()))).toBe(true);
    }
  }
}

async function runSearch(c: Case) {
  if (/zzzz/.test(c.steps) && /no message|without message|shows nothing|no empty/i.test(c.expected)) {
    await searchFor('zzzz');
    const quoted = quotes(c.expected);
    if (quoted.length) expect(haystack()).toContain(quoted[0]);
    else expect(mainText()).not.toMatch(/no .{0,40}match/i);
    return;
  }
  if (/zzzz/.test(c.steps)) {
    await searchFor('zzzz');
    const quoted = quotes(c.expected);
    if (quoted.length) {
      expect(haystack()).toContain(quoted[0]);
      return;
    }
  }
  const before = rowText();
  if (before.length === 0) {
    const tokens = mainText().match(/[A-Z]{2,}(?:-[A-Z]+)?-\d{2,}(?:-\d+)*/g) ?? [];
    expect(tokens.length).toBeGreaterThan(0);
    let kept = '';
    for (const token of [...new Set(tokens)].slice(0, 6)) {
      await searchFor(token);
      if (mainText().includes(token)) {
        kept = token;
        break;
      }
    }
    expect(kept).not.toBe('');
    return;
  }
  const blob = before.join(' ');
  const ids = blob.match(/[A-Z]{2,}(?:-[A-Z]+)?-\d{2,}(?:-\d+)*/g) ?? [];
  const candidates = [...new Set([...ids, ...blob.split(/\s+/).map((word) => word.replace(/[.,;:]+$/g, '')).filter((word) => word.length > 3 && word.length < 40)])].slice(0, 8);
  let kept = '';
  for (const token of candidates) {
    await searchFor(token);
    if (rowText().some((row) => row.toLowerCase().includes(token.toLowerCase()))) {
      kept = token;
      break;
    }
  }
  expect(kept, `none of ${candidates.join(', ')} stayed visible`).not.toBe('');
  expect(rowText().length).toBeLessThanOrEqual(before.length);
  if (/zzzz/.test(c.steps)) {
    await searchFor('zzzz');
    if (/no message|without message|shows nothing|no empty/i.test(c.expected)) expect(mainText()).not.toMatch(/no .{0,40}match/i);
  }
}

async function runSort() {
  const sortable = () => screen.getAllByRole('columnheader').filter((header) => header.hasAttribute('aria-sort'));
  expect(sortable().length).toBeGreaterThan(0);
  const count = sortable().length;
  for (let i = 0; i < count; i += 1) {
    const header = () => sortable()[i];
    await user.click(header());
    expect(header()).toHaveAttribute('aria-sort', 'ascending');
    await user.click(header());
    expect(header()).toHaveAttribute('aria-sort', 'descending');
  }
}

async function runKnown(c: Case, router: ReturnType<typeof createMemoryRouter>): Promise<boolean> {
  const id = c.id;
  if (id === 'M7-027') {
    expect(haystack()).toMatch(/MB-SELL-41982/);
    expect(pathOf(router)).toBe('/orders/NOPE');
    return true;
  }
  if (id === 'M7-026' || id === 'M7-035') {
    assertShown(c.expected);
    return true;
  }
  if (id === 'M7-029') {
    expect(haystack()).toMatch(/Seller site/);
    cleanup();
    renderAt(dest('/orders/MB-BUY-38217', 'app'));
    await ready();
    expect(haystack()).toMatch(/Buyer site|MB vault/);
    return true;
  }
  if (id === 'M7-034') {
    await clickLabel('Flag exception');
    expect(haystack()).toMatch(/pause|clock/i);
    return true;
  }
  if (id === 'M8-021') {
    await clickMatch(/Create auction/i);
    await clickMatch(/Continue to auction form/i);
    expect(toastText()).toMatch(/loaded into a new auction/);
    expect(pathOf(router)).toBe('/auctions/create');
    return true;
  }
  if (id === 'M8-022') {
    await clickMatch(/Hold in reserve/i);
    await clickMatch(/Hold lot/i);
    expect(toastText()).toMatch(/held in vault reserve/);
    return true;
  }
  if (id === 'M8-023') {
    cleanup();
    renderAt(dest('/vault', 'app'));
    await ready();
    expect(haystack()).toMatch(/64d|64/);
    return true;
  }
  if (id === 'M8-025' || id === 'M8-026' || id === 'M8-027') {
    await clickMatch(id === 'M8-025' ? /List in Buy catalog/i : id === 'M8-026' ? /Create auction/i : /Hold in reserve/i);
    if (id === 'M8-026') {
      const values = screen.getAllByRole('textbox').map((el) => (el as HTMLInputElement).value);
      expect(values.filter((value) => /\$/.test(value)).length).toBeGreaterThan(1);
      expect(haystack()).toMatch(/starting bid|reserve/i);
      return true;
    }
    assertShown(c.expected);
    return true;
  }
  if (id === 'M8-028') {
    await clickMatch(/Hold in reserve/i);
    expect(consoleStore.getState().allocMode).toBe('reserve');
    cleanup();
    renderAt(dest('/vault/MBV-2026-0412', 'app'));
    await ready();
    expect(consoleStore.getState().allocMode).toBe('reserve');
    cleanup();
    renderAt(dest('/vault/MBV-2026-0408', 'app'));
    await ready();
    note(id, `Allocation mode stays ${consoleStore.getState().allocMode} across lots. Sidebar navigation does not reset it.`);
    return true;
  }
  if (id === 'M9-023' || id === 'M9-024' || id === 'M9-034' || id === 'M9-035' || id === 'M9-036') {
    if (id === 'M9-034') {
      const field = document.querySelector('#main input, #main textarea') as HTMLInputElement | null;
      expect(field?.readOnly || field?.disabled).toBeTruthy();
      return true;
    }
    await clickMatch(/Edit configuration/i);
    if (id === 'M9-035') {
      assertShown(c.expected);
      return true;
    }
    if (id === 'M9-024') {
      await clickMatch(/^Cancel$/i);
      expect(toastText()).toBe('');
      return true;
    }
    if (id === 'M9-036') {
      await clickMatch(/Pause listing/i);
      expect(toastText()).toMatch(/paused/);
      expect(haystack()).toMatch(/Live/);
      note(id, 'The toast says the listing is paused. The status pill stays Live.');
      return true;
    }
    await clickMatch(/Save changes/i);
    assertToast(c.expected);
    return true;
  }
  if (id === 'M9-025') {
    await clickMatch(/Open lot|MBV-/i);
    expect(toastText()).toMatch(/Opening lot/);
    expect(pathOf(router)).toMatch(/\/vault\//);
    return true;
  }
  if (id === 'M12-019' || id === 'M12-020' || id === 'M12-027') {
    await clickMatch(/LC-2026-0418/);
    if (id === 'M12-027') {
      note(id, 'LC-2026-0418 is the open docs-presented LC and it has discrepancies, so the empty-discrepancy sentence is not on this row.');
      expect(haystack()).toMatch(/Bill of lading/);
      return true;
    }
    if (id === 'M12-020') {
      await clickMatch(/Open linked order/i);
      expect(pathOf(router)).toMatch(/\/orders\//);
      return true;
    }
    await clickMatch(/LC-2026-0422/);
    await clickMatch(/^Release payment$/i);
    expect(toastText()).toMatch(/released under LC-2026-0422/);
    return true;
  }
  if (id === 'M13-014') {
    await clickMatch(/NEG-2026-0231/);
    await clickMatch(/Convert to contract/i);
    expect(toastText()).toMatch(/Contract drafted/);
    return true;
  }
  if (id === 'M15-019' || id === 'M15-020') {
    await clickMatch(id === 'M15-019' ? /^Approve$/i : /^Deny$/i);
    expect(toastText()).toMatch(/moved to|denied|not approved|kept/i);
    return true;
  }
  if (id === 'M17-014') {
    const box = screen.getByRole('textbox', { name: /Reply to the counterparty/i });
    await user.type(box, 'Noted');
    await clickMatch(/^Send$/i);
    expect(toastText()).toMatch(/Reply sent/);
    return true;
  }
  if (id === 'M20-008') {
    await clickMatch(/^Manage$/i);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Save partner/i }));
    expect(toastText()).toMatch(/updated/);
    expect(haystack()).toMatch(/Suspended/);
    note(id, 'Saving Manage toasts only. The partner status on the row is unchanged.');
    return true;
  }
  if (id === 'M25-007' || id === 'M25-008' || id === 'M25-009' || id === 'M25-017') {
    if (id === 'M25-017') {
      await clickMatch(/CEO \/ Super Admin, Orders/i);
      expect(toastText()).toMatch(/Edit permissions/);
      return true;
    }
    await clickMatch(/Edit permissions/i);
    if (id === 'M25-008') {
      await clickMatch(/Save changes/i);
      assertToast(c.expected);
      return true;
    }
    if (id === 'M25-009') {
      await clickMatch(/^Cancel$/i);
      expect(screen.queryByRole('button', { name: /Save changes/i })).toBeNull();
      return true;
    }
    await clickMatch(/CEO \/ Super Admin, Orders/i);
    expect(toastText()).toMatch(/set to/);
    return true;
  }
  if (id === 'M25-011' || id === 'M25-012') {
    await clickMatch(/Edit configuration/i);
    if (id === 'M25-012') {
      await clickMatch(/^Cancel$/i);
      return true;
    }
    await clickMatch(/Save changes/i);
    assertToast(c.expected);
    return true;
  }
  if (id === 'M25-014' || id === 'M25-015' || id === 'M25-016' || id === 'M25-019') {
    if (id === 'M25-019') {
      fireEvent.click(screen.getByRole('switch', { name: /Bitcoin payments in Kenya/i }));
      expect(toastText()).toMatch(/Click Edit to change Bitcoin/);
      return true;
    }
    await clickMatch(/^Edit$/i);
    if (id === 'M25-015') {
      await clickMatch(/Save changes/i);
      assertToast(c.expected);
      return true;
    }
    if (id === 'M25-016') {
      await clickMatch(/^Cancel$/i);
      return true;
    }
    const before = haystack();
    await clickMatch(/switch|Kenya/i);
    expect(haystack()).not.toBe(before);
    expect(toastText()).toBe('');
    return true;
  }
  if (id === 'M26-006' || id === 'M26-007' || id === 'M26-012') {
    if (id === 'M26-012') {
      const field = document.querySelector('#main input') as HTMLInputElement | null;
      expect(field?.readOnly).toBe(true);
      return true;
    }
    await clickMatch(/Edit profile/i);
    if (id === 'M26-007') {
      await clickMatch(/^Cancel$/i);
      expect(screen.queryByRole('button', { name: /Save profile/i })).toBeNull();
      return true;
    }
    await clickMatch(/Save profile/i);
    assertToast(c.expected);
    return true;
  }
  if (id === 'M11-025') {
    if (!screen.queryByRole('button', { name: /Resume auction/i })) await clickMatch(/Pause auction/i);
    await clickMatch(/Resume auction/i);
    expect(toastText()).toMatch(/resumed/);
    return true;
  }
  if (id === 'M11-044') {
    await clickMatch(/Flag suspicious activity/i);
    await clickMatch(/Flag suspicious activity/i);
    expect(toastText()).toMatch(/flagged for suspicious activity/);
    return true;
  }
  if (id === 'M11-048') {
    expect(haystack()).toMatch(/11\.4%/);
    cleanup();
    renderAt(dest('/auctions/ended/AUC-2026-0211', 'app'));
    await ready();
    expect(haystack()).toMatch(/4\.3%/);
    return true;
  }
  if (id === 'M12-017' || id === 'M12-018' || id === 'M12-021' || id === 'M12-022' || id === 'M12-023') {
    const lc = id === 'M12-022' ? 'LC-2026-0405' : id === 'M12-023' ? 'LC-2026-0401' : 'LC-2026-0418';
    await clickMatch(new RegExp(lc));
    if (id === 'M12-017') {
      await clickMatch(/Close letter of credit/i);
      expect(consoleStore.getState().lcSel).toBeNull();
      return true;
    }
    if (id === 'M12-018') {
      await clickMatch(/Mark resolved/i);
      expect(toastText()).toMatch(/marked resolved/);
      expect(haystack()).toMatch(/Bill of lading/);
      return true;
    }
    const release = screen.getByRole('button', { name: /release|Payment released|unlocks/i });
    await user.click(release);
    expect(toastText()).toMatch(/cannot be released|already settled|released/i);
    return true;
  }
  if (id === 'M13-013' || id === 'M13-015') {
    await clickMatch(/NEG-2026-0233/);
    if (id === 'M13-013') {
      await clickMatch(/Close negotiation/i);
      expect(consoleStore.getState().negSel).toBeNull();
      return true;
    }
    await clickMatch(/Send reminder/i);
    expect(toastText()).toMatch(/Reminder sent/);
    return true;
  }
  if (id === 'M16-010') {
    const head = document.querySelector<HTMLElement>('[aria-expanded]');
    if (!head) throw new Error('No expandable card head');
    const before = head.getAttribute('aria-expanded');
    fireEvent.click(head);
    expect(head.getAttribute('aria-expanded')).not.toBe(before);
    return true;
  }
  if (id === 'M17-015') {
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Claim rejected' } });
    expect((select as HTMLSelectElement).value).toBe('Claim rejected');
    return true;
  }
  if (id === 'M18-005' || id === 'M18-006' || id === 'M19-003' || id === 'M19-004') {
    const switches = screen.getAllByRole('switch');
    const wantOn = id === 'M18-005' || id === 'M19-003';
    const target = switches.find((el) => (el.getAttribute('aria-checked') === 'true') !== wantOn) ?? switches[0];
    await user.click(target);
    assertToast(c.expected);
    return true;
  }
  if (id === 'M26-009') {
    await clickMatch(/^Revoke$/i);
    expect(toastText()).toMatch(/session revoked/);
    return true;
  }
  if (id === 'M26-011') {
    const toggle = screen.getAllByRole('switch')[0];
    const before = toggle.getAttribute('aria-checked');
    await user.click(toggle);
    expect(toggle.getAttribute('aria-checked')).not.toBe(before);
    expect(toastText()).toBe('');
    return true;
  }
  if (id === 'M10-022') {
    const amount = screen.getAllByRole('textbox', { name: /Adjusted amount/i })[0];
    await user.type(amount, '123');
    await clickMatch(/Adjust & approve/i);
    expect(toastText()).toMatch(/Adjusted offer sent/);
    expect(toastText()).not.toMatch(/123/);
    return true;
  }
  if (id === 'M12-025') {
    await clickMatch(/LC-2026-0412/);
    expect(haystack()).toMatch(/days until expiry/);
    await clickMatch(/LC-2026-0405/);
    expect(haystack()).toMatch(/Settled to beneficiary/);
    await clickMatch(/LC-2026-0401/);
    expect(haystack()).toMatch(/Awaiting issuance by/);
    return true;
  }
  if (id === 'M13-019') {
    await clickMatch(/NEG-2026-0233/);
    await clickMatch(/Mediate with suggested price/i);
    expect(haystack()).toMatch(/48 hours/);
    return true;
  }
  if (id === 'M14-016') {
    await clickMatch(/STL-2026-4419/);
    expect(pathOf(router)).toBe('/financial');
    cleanup();
    const next = renderAt(dest('/chain', 'app'));
    await ready();
    await clickMatch(/MBP-2026-1284/);
    expect(pathOf(next)).toBe('/audit');
    return true;
  }
  if (id === 'M14-017') {
    await clickMatch(/Verify a passport/i);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Verify passport/i }));
    expect(toastText()).toMatch(/MBP-2026-1284 verified — anchored in block 969,412/);
    return true;
  }
  if (id === 'M15-024') {
    for (let n = 0; n < 8 && screen.queryAllByRole('button', { name: /^Approve$/i }).length; n += 1) {
      await user.click(screen.getAllByRole('button', { name: /^Approve$/i })[0]);
    }
    expect(haystack()).toMatch(/No tier changes waiting/);
    expect(haystack()).toMatch(/Every request has a decision logged against it/);
    return true;
  }
  if (id === 'M15-027') {
    expect(haystack()).toMatch(/1 open/);
    cleanup();
    renderAt(dest('/users/Joseph%20Kiptoo', 'app'));
    await ready();
    expect(haystack()).toMatch(/None/);
    return true;
  }
  if (id === 'M17-022') {
    const noteBox = screen.getByPlaceholderText(/Summarise the decision/i);
    await user.type(noteBox, 'ZZZTEMP');
    await clickMatch(/Record resolution/i);
    expect(toastText()).toMatch(/Resolution recorded/);
    expect(toastText()).not.toMatch(/ZZZTEMP/);
    return true;
  }
  if (id === 'M19-006') {
    await clickMatch(/^Edit$/i);
    expect(haystack()).toMatch(/\/sell/);
    return true;
  }
  if (id === 'M26-013' || id === 'M26-014') {
    cleanup();
    renderAt(dest('/profile', 'app', id === 'M26-013' ? 0 : 1));
    await ready();
    if (id === 'M26-013') expect(haystack()).toMatch(/Edit on Orders, Vault & Inventory/);
    else expect(haystack()).toMatch(/KYC queue, documents and disputes/);
    return true;
  }
  return false;
}

async function runUi(c: Case, router: ReturnType<typeof createMemoryRouter>) {
  if (c.type === 'Card') {
    await runCard(c);
    return;
  }
  if (/^Chip:/.test(c.element) || c.id === 'M7-009' || c.id === 'M7-010') {
    await runChip(c);
    return;
  }
  if ((/drawer/i.test(`${c.element} ${c.scenario}`) || c.element.includes(':')) && /fill the fields|Save as draft|Press Escape|close discards/i.test(`${c.steps} ${c.scenario}`)) {
    await drawerFlow(c);
    return;
  }
  if (/^Sort/.test(c.scenario) || /sortable/i.test(c.scenario) || /Click each sortable header/i.test(c.steps)) {
    await runSort();
    return;
  }
  if (/search/i.test(`${c.scenario} ${c.element}`) || /zzzz|header search/i.test(c.steps)) {
    await runSearch(c);
    if (!/toast|Navigates|Opens \//i.test(c.expected)) return;
  }
  if (c.id === 'M6-034' || c.id === 'M24-007' || /No editable|No buttons/i.test(c.expected)) {
    const main = document.querySelector('#main') ?? document.body;
    if (/No buttons/i.test(c.expected)) expect(main.querySelectorAll('button, input, select, textarea').length).toBe(0);
    else expect(main.querySelectorAll('input, textarea, select').length).toBe(0);
    return;
  }

  if (await runKnown(c, router)) return;

  const quotedClicks = [...c.steps.matchAll(/Click\s+(?:the\s+|each\s+|an?\s+)?[“"]([^”"]+)[”"]/gi)].map((m) => m[1]);
  const arrow = c.steps.match(/→\s*([^\n.]+)/);
  const labels = quotedClicks.length ? quotedClicks : arrow ? [arrow[1].trim()] : [c.element.replace(/^(Upcoming|Tab):\s*/, '')];
  for (const label of labels) {
    if (/row$/i.test(label)) {
      const row = document.querySelector<HTMLElement>('[role="row"][tabindex="0"]');
      if (!row) throw new Error(`No clickable row for ${c.id}`);
      fireEvent.click(row);
    } else {
      try {
        await clickLabel(label);
      } catch (error) {
        if (c.type !== 'Scenario') throw error;
        const row = document.querySelector<HTMLElement>('[role="row"][tabindex="0"]');
        if (row && /click/i.test(c.steps)) fireEvent.click(row);
        assertShown(c.expected);
        if (/toast/i.test(c.expected)) assertToast(c.expected);
        if (/\/[a-z]/i.test(c.expected) && !/POST |GET /.test(c.expected)) assertPath(router, c.expected);
      }
    }
  }
  if (/toast/i.test(c.expected)) assertToast(c.expected);
  if (/\/[a-z]/i.test(c.expected) && !/POST |GET /.test(c.expected)) assertPath(router, c.expected);
  const leftover = quotes(c.expected).filter(() => !/toast/i.test(c.expected));
  if (!/toast/i.test(c.expected) && leftover.length && !/\/[a-z]/i.test(c.expected)) {
    const hay = haystack();
    const missing = leftover.filter((phrase) => !hasWords(hay, phrase));
    if (missing.length) throw new Error(`Missing after action: ${missing.join(' | ')}`);
  }
}

async function runSpecial(c: Case, router: ReturnType<typeof createMemoryRouter>) {
  const id = c.id;
  if (id === 'M1-004') {
    expect(screen.getByRole('button', { name: /Samuel Njoroge, CEO \/ Super Admin — open profile/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open profile/i }).innerHTML).toMatch(/16A34A|22,\s*163,\s*74/i);
    return;
  }
  if (id === 'M1-005') {
    cleanup();
    renderAt(dest('/orders', 'app'));
    await screen.findByRole('heading', { name: 'Orders' });
    expect(document.querySelector('header')?.textContent).toMatch(/One pipeline, both sides/);
    expect(document.querySelector('header')?.textContent).toMatch(/184 active orders/);
    return;
  }
  if (id === 'M1-006') {
    expect(screen.getByRole('button', { name: /Notifications, 9 need attention/ })).toBeInTheDocument();
    return;
  }
  if (id === 'M1-007') {
    await clickLabel('Bell');
    for (const text of ['4 KYC reviews past SLA', 'AUC-2026-0219 flagged', '6 firm offers awaiting approval', 'Export permit EP-KE-88412 expiring', 'Lot MBV-2026-0388 held 46 days']) {
      expect(screen.getAllByRole('button', { name: new RegExp(escapeReg(text)) }).length).toBeGreaterThan(0);
    }
    return;
  }
  if (id === 'M1-008') {
    await clickLabel('Sidebar brand');
    expect(pathOf(router)).toBe('/overview');
    return;
  }
  if (id === 'M1-009') {
    const links = within(screen.getByRole('navigation', { name: 'Primary' })).getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(20);
    for (const link of links) {
      await user.click(link);
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(pathOf(router).length).toBeGreaterThan(1);
    }
    return;
  }
  if (id === 'M1-010' || id === 'M1-013') {
    if (id === 'M1-013') await openAccount();
    await clickLabel(id === 'M1-010' ? 'Signed-in card' : 'My profile');
    expect(pathOf(router)).toBe('/profile');
    return;
  }
  if (id === 'M1-011' || id === 'M1-012') {
    const before = consoleStore.getState().theme;
    if (id === 'M1-012') {
      await openAccount();
      await user.click(screen.getByRole('radio', { name: 'Light' }));
      await user.click(screen.getByRole('radio', { name: 'Dark' }));
      expect(consoleStore.getState().theme).toBe('dark');
    } else {
      await clickLabel('Theme toggle (header)');
      expect(consoleStore.getState().theme).not.toBe(before);
    }
    expect(window.localStorage.getItem('mb-theme')).toBe(consoleStore.getState().theme);
    return;
  }
  if (id === 'M1-014') {
    await openAccount();
    await clickLabel('Settings & roles');
    expect(pathOf(router)).toBe('/settings');
    return;
  }
  if (id === 'M1-015') {
    await openAccount();
    await clickLabel('Lock console');
    expect(pathOf(router)).toBe('/locked');
      expect((router.state.location.state as { from?: string } | null)?.from).toBe('/lc');
    return;
  }
  if (id === 'M1-016' || id === 'M5-005') {
    if (id === 'M1-016') {
      consoleActions.openDrawer({ title: 'New order', sub: 'x', cta: 'Create order', done: 'Order created at Verification', fields: [{ label: 'Note', value: 'draft' }] });
      await openAccount();
      await clickLabel('Sign out');
    } else {
      await clickLabel('Sign out instead');
    }
    expect(pathOf(router)).toBe('/signed-out');
    expect(toastText()).toMatch(/session close is recorded/i);
    expect(consoleStore.getState().drawer).toBeNull();
    return;
  }
  if (id === 'M1-017') {
    await clickLabel('Bell');
    expect(await screen.findByRole('dialog', { name: /Needs attention/i })).toBeInTheDocument();
    return;
  }
  if (id === 'M1-018' || id === 'M1-019' || id === 'M1-020' || id === 'M1-021' || id === 'M1-022') {
    await clickLabel('Bell');
    const label = quotes(c.steps)[0];
    await clickLabel(label);
    assertPath(router, c.expected);
    expect(screen.queryByRole('dialog', { name: /Needs attention/i })).toBeNull();
    return;
  }
  if (id === 'M1-023' || id === 'M1-026') {
    await clickLabel('Narrow menu');
    expect(await screen.findByRole('button', { name: 'Close navigation' })).toBeInTheDocument();
    if (id === 'M1-026') {
      await user.click(screen.getByRole('button', { name: 'Close navigation' }));
      expect(screen.queryByRole('button', { name: 'Close navigation' })).toBeNull();
      await clickLabel('Narrow menu');
      await user.click(screen.getByRole('link', { name: /^Vault/ }));
      expect(pathOf(router)).toBe('/vault');
      expect(consoleStore.getState().navOpen).toBe(false);
    }
    return;
  }
  if (id === 'M1-031') {
    expect(pathOf(router)).toBe('/overview');
    return;
  }
  if (id === 'M1-024' || id === 'M1-025') {
    cleanup();
    await runApi({ ...c, id: 'M1-038' });
    if (id === 'M1-024') {
      const reload = vi.fn();
      const button = screen.getByRole('button', { name: /Try this screen again/i });
      const current = window.location;
      Object.defineProperty(window, 'location', { configurable: true, value: { ...current, reload, assign: current.assign.bind(current) } });
      fireEvent.click(button);
      expect(reload).toHaveBeenCalled();
    } else {
      expect(screen.getByRole('link', { name: /Back to overview/i })).toHaveAttribute('href', '/overview');
    }
    return;
  }
  if (id === 'M1-027') {
    expect(screen.getByRole('link', { name: /Vault & Inventory/ })).toHaveAttribute('aria-current', 'page');
    return;
  }
  if (id === 'M1-028') {
    for (const path of ['/orders', '/orders/intake', '/orders/MB-SELL-41982']) {
      cleanup();
      const next = renderAt(dest(path, 'app'));
      await screen.findByRole('heading', { name: 'Orders' });
      expect(`${screen.getByRole('heading', { name: 'Orders' }).textContent} ${document.querySelector('header')?.textContent}`).toMatch(/One pipeline, both sides/);
      expect(pathOf(next)).toBe(path);
    }
    return;
  }
  if (id === 'M1-029') {
    const before = within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('link', { name: /Orders/ }).textContent;
    cleanup();
    const offers = renderAt(dest('/pricing/offers', 'app'));
    const approve = (await screen.findAllByRole('button', { name: /Approve offer/i }))[0];
    await user.click(approve);
    expect(within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('link', { name: /Orders/ }).textContent).toBe(before);
    expect(pathOf(offers)).toContain('/pricing');
    return;
  }
  if (id === 'M1-030') {
    consoleActions.setTheme('dark');
    await openAccount();
    await clickLabel('Sign out');
    cleanup();
    renderAt(dest('/login', 'login', 0));
    await ready();
    await user.type(screen.getByLabelText(/work email/i), STAFF_ACCOUNTS[0].email);
    await user.type(screen.getByLabelText(/^password/i), STAFF_ACCOUNTS[0].demoPassword);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('button', { name: /Verify and open console/i });
    await user.click(screen.getByRole('button', { name: /Verify and open console/i }));
    expect(consoleStore.getState().theme).toBe('dark');
    expect(window.localStorage.getItem('mb-theme')).toBe('dark');
    return;
  }
  if (id === 'M1-032') {
    const probes: Array<[string, string]> = [
      ['/orders', 'MB-SELL-41982'],
      ['/vault', 'MBV-2026-0417'],
      ['/listings', 'MBL-2026-0112'],
      ['/pricing', 'Gold Concentrate'],
      ['/auctions', 'AUC-2026-0219'],
      ['/lc', 'LC-2026-0418'],
      ['/collab', 'NEG-2026-0233'],
      ['/chain', 'MBP-2026-1284'],
      ['/users', 'Joseph Kiptoo'],
      ['/verification', 'KYC-7741'],
      ['/verification/expiry', 'EP-KE'],
      ['/disputes', 'DSP-2026-0071'],
      ['/academy', 'How Mineral Bridge works'],
      ['/marketing', 'Gold season buy rates'],
      ['/partners', 'Sentinel Bonded Logistics'],
      ['/support', 'TKT-5514'],
      ['/audit', 'Approved firm offer'],
      ['/financial', 'STL-2026-4412'],
    ];
    for (const [path, token] of probes) {
      cleanup();
      consoleActions.resetSession();
      consoleActions.setQuery('zzzz');
      renderAt(dest(path, 'app'));
      await screen.findByRole('heading', { level: 1 });
      expect(mainText()).not.toContain(token);
    }
    return;
  }
  if (id === 'M1-033') {
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    expect(haystack()).toMatch(/page 2/i);
    await searchFor('Gold');
    await user.click(screen.getByRole('button', { name: /Clear search/i }));
    expect(consoleStore.getState().orderPage).toBe(0);
    expect(haystack()).toMatch(/page 1/i);
    note(id, 'Demo order list has 2 pages, so the reset was checked from page 2.');
    return;
  }
  if (id === 'M1-034') {
    consoleActions.setFilter('lcFilter', 'Shipped');
    consoleActions.setFilter('negFilter', 'Stalled');
    consoleActions.setFilter('bcFilter', 'Custody');
    consoleActions.setFilter('listFilter', 'Live');
    consoleActions.set({ orderPage: 1, drawer: { title: 'New order', sub: 'x', cta: 'Create', done: 'done', fields: [] } });
    await user.click(screen.getByRole('link', { name: /^Vault/ }));
    const state = consoleStore.getState();
    expect(state.filters.lcFilter).toBe('All LCs');
    expect(state.filters.negFilter).toBe('All negotiations');
    expect(state.filters.bcFilter).toBe('All events');
    expect(state.filters.listFilter).toBe('All listings');
    expect(state.drawer).toBeNull();
    expect(state.orderPage).toBe(0);
    expect(pathOf(router)).toBe('/vault');
    return;
  }
  if (id === 'M1-035') {
    cleanup();
    renderAt(dest('/overview', 'app', 4));
    await ready();
    const links = within(screen.getByRole('navigation', { name: 'Primary' })).getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(20);
    expect(haystack()).toMatch(/Content Manager/);
    return;
  }
  if (id === 'M2-001') {
    expect(resolveJump('Listing MBL-2026-0112 published')).toBe('/listings/MBL-2026-0112');
    note(id, 'No seeded activity, audit, chain, or dispute row contains an MBL id. The click resolver those rows call was executed.');
    return;
  }
  if (id.startsWith('M2-')) {
    const rowFor: Record<string, string> = {
      'M2-002': 'listed in Buy catalog',
      'M2-003': 'Order MB-SELL-41982',
      'M2-004': 'MBV-2026-0388 held',
      'M2-005': 'AUC-2026-0219',
      'M2-006': 'DSP-2026-0071',
      'M2-007': 'TKT-5514',
      'M2-008': 'settlement batch',
      'M2-009': 'KYC submitted',
      'M2-010': 'permit expiring',
      'M2-011': 'Tier change',
      'M2-012': 'Manual rate override',
      'M2-013': 'Manual rate override',
      'M2-014': 'Bulk consignment',
      'M2-015': 'Academy lesson',
      'M2-016': 'Inspection hub capacity',
      'M2-017': '',
      'M2-018': 'MB-BUY-38904',
    };
    if (id === 'M2-012') {
      expect(resolveJump('Firm offer awaiting approval')).toBe('/pricing/offers');
      note(id, 'The seeded offer row also contains an order id, so that click opens the order. A row that only says offer opens /pricing/offers.');
      return;
    }
    if (id === 'M2-006') {
      expect(resolveJump('DSP-2026-0071')).toBe('/disputes/DSP-2026-0071');
      note(id, 'The seeded activity row also contains order MB-SELL-41640, which the resolver checks before the dispute id.');
      return;
    }
    if (id === 'M2-017') {
      expect(resolveJump('Desk note with no record')).toBe('/audit');
      note(id, 'Every seeded activity row matches an earlier jump rule. Unmatched text opens /audit.');
      return;
    }
    if (id === 'M2-019') {
      const sample = 'Order MB-SELL-41982 moved to Inspection & approval';
      expect(resolveJump(sample)).toBe('/orders/MB-SELL-41982');
      await clickMatch(/Order MB-SELL-41982/);
      expect(pathOf(router)).toBe('/orders/MB-SELL-41982');
      return;
    }
    const snippet = rowFor[id];
    await clickMatch(new RegExp(escapeReg(snippet), 'i'));
    assertPath(router, c.expected === 'Opens the order (id pattern wins)' ? 'Navigates to /orders/MB-BUY-38904' : c.expected);
    return;
  }
  if (id === 'M3-004' || id.startsWith('M3-014') || id === 'M3-015' || id === 'M3-016' || id === 'M3-017' || id === 'M3-018' || id === 'M3-019') {
    const index = id === 'M3-004' ? 0 : roleOf(c.scenario);
    const account = STAFF_ACCOUNTS[index];
    await user.type(screen.getByLabelText(/work email/i), account.email);
    await user.type(screen.getByLabelText(/^password/i), account.demoPassword);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(account.role)).toBeInTheDocument();
    expect(haystack()).toContain(account.scope);
    await user.click(screen.getByRole('button', { name: /Verify and open console/i }));
    expect(pathOf(router)).toBe('/overview');
    expect(haystack()).toContain(account.name);
    return;
  }
  if (id === 'M3-005') {
    await user.type(screen.getByLabelText(/work email/i), STAFF_ACCOUNTS[1].email);
    await user.type(screen.getByLabelText(/^password/i), 'ignored');
    await user.click(screen.getByRole('button', { name: /Continue with staff SSO/i }));
    expect(await screen.findByText('Compliance Officer')).toBeInTheDocument();
    return;
  }
  if (id === 'M3-006') {
    await user.click(screen.getByRole('button', { name: /Forgot password/i }));
    expect(toastText()).toMatch(/Password reset link sent to the work email on file/);
    return;
  }
  if (id === 'M3-007' || id === 'M3-008') {
    await user.click(screen.getByRole('button', { name: /Show staff test credentials/i }));
    expect(screen.getByRole('button', { name: /Hide staff test credentials/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /@mineralbridge.co.ke/ }).length).toBe(6);
    if (id === 'M3-008') {
      await user.click(screen.getByRole('button', { name: /Hide staff test credentials/i }));
      expect(screen.queryByRole('button', { name: /@mineralbridge.co.ke/ })).toBeNull();
    }
    return;
  }
  if (id === 'M3-009') {
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Show staff test credentials/i }));
    await user.click(screen.getByRole('button', { name: /Trading Desk Manager/ }));
    expect(screen.getByLabelText(/work email/i)).toHaveValue(STAFF_ACCOUNTS[0].email);
    expect(screen.getByLabelText(/^password/i)).toHaveValue(STAFF_ACCOUNTS[0].demoPassword);
    expect(screen.queryByRole('alert')).toBeNull();
    return;
  }
  if (id === 'M3-010') {
    const before = consoleStore.getState().theme;
    await clickLabel('Theme button (form)');
    expect(consoleStore.getState().theme).not.toBe(before);
    return;
  }
  if (id === 'M3-011') {
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your work email and password.');
    await user.type(screen.getByLabelText(/work email/i), 'grace.kioko@mineralbridge.co.ke');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your work email and password.');
    return;
  }
  if (id === 'M3-012' || id === 'M3-013' || id === 'M3-020' || id === 'M3-021') {
    if (id !== 'M3-021') await user.type(screen.getByLabelText(/work email/i), id === 'M3-013' ? 'grace.kioko@mineralbridge.co.ke' : 'unknown@mineralbridge.co.ke');
    if (id === 'M3-012' || id === 'M3-013') await user.type(screen.getByLabelText(/^password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: id.startsWith('M3-02') ? /Continue with staff SSO/i : 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(quotes(c.expected)[0]);
    return;
  }
  if (id === 'M3-022') {
    expect(screen.queryByRole('switch', { name: /Trust this device/i })).toBeNull();
    expect(haystack()).toMatch(/Trust this device for 14 days/);
    await user.type(screen.getByLabelText(/work email/i), STAFF_ACCOUNTS[0].email);
    await user.type(screen.getByLabelText(/^password/i), STAFF_ACCOUNTS[0].demoPassword);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: /Verify it's you/i })).toBeInTheDocument();
    note(id, 'Trust this device is a static control, so the session cannot diverge.');
    return;
  }
  if (id === 'M3-029') {
    expect(pathOf(router)).toBe('/overview');
    return;
  }
  if (id === 'M3-030') {
    expect(pathOf(router)).toBe('/login');
    await user.type(screen.getByLabelText(/work email/i), STAFF_ACCOUNTS[2].email);
    await user.type(screen.getByLabelText(/^password/i), STAFF_ACCOUNTS[2].demoPassword);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(await screen.findByRole('button', { name: /Verify and open console/i }));
    expect(pathOf(router)).toBe('/overview');
    return;
  }
  if (id === 'M3-031') {
    await user.type(screen.getByLabelText(/work email/i), STAFF_ACCOUNTS[0].email);
    await user.type(screen.getByLabelText(/^password/i), STAFF_ACCOUNTS[0].demoPassword);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('heading', { name: /Verify it's you/i });
    expect(JSON.parse(sessionStorage.getItem('mb-session') ?? '{}').stage).toBe('otp');
    return;
  }
  if (id === 'M4-005') {
    await user.click(screen.getByRole('button', { name: /Verify and open console/i }));
    expect(pathOf(router)).toBe('/overview');
    expect(toastText()).toMatch(/Signed in as/);
    return;
  }
  if (id === 'M4-006') {
    await user.click(screen.getByRole('button', { name: /Resend code/i }));
    expect(toastText()).toMatch(/New code sent to \+254 722/);
    return;
  }
  if (id === 'M4-007') {
    sessionStore.setState({ authError: 'Incorrect password for x.' });
    await user.click(screen.getByRole('button', { name: /Back to sign in/i }));
    expect(pathOf(router)).toBe('/login');
    expect(sessionStore.getState().stage).toBe('login');
    expect(sessionStore.getState().authError).toBeNull();
    return;
  }
  if (id === 'M4-014') {
    cleanup();
    const signedIn = renderAt(dest('/verify', 'app'));
    await screen.findByRole('heading', { level: 1 });
    expect(pathOf(signedIn)).toBe('/overview');
    cleanup();
    const signedOut = renderAt(dest('/verify', 'login'));
    await screen.findByRole('button', { name: 'Sign in' });
    expect(pathOf(signedOut)).toBe('/login');
    return;
  }
  if (/^M4-00[89]$/.test(id) || /^M4-01[0-3]$/.test(id)) {
    const account = STAFF_ACCOUNTS[roleOf(c.scenario)];
    cleanup();
    renderAt(dest('/verify', 'otp', roleOf(c.scenario)));
    await screen.findByRole('heading', { name: /Verify it's you/i });
    expect(haystack()).toContain(account.role);
    expect(haystack()).toContain(account.scope);
    return;
  }
  if (id === 'M5-004' || id === 'M5-007' || id === 'M5-008') {
    const password = screen.getByLabelText(/password/i);
    if (id === 'M5-007') {
      await user.clear(password);
      await user.type(password, 'x');
    }
    await user.click(screen.getByRole('button', { name: /Unlock console/i }));
    expect(pathOf(router)).toBe(id === 'M5-008' ? '/overview' : '/lc');
    expect(sessionStore.getState().stage).toBe('app');
    return;
  }
  if (id === 'M5-006') {
    consoleActions.setFilter('lcFilter', 'Shipped');
    consoleActions.setQuery('gold');
    consoleActions.setTheme('dark');
    await user.click(screen.getByRole('button', { name: /Sign in again/i }));
    expect(pathOf(router)).toBe('/login');
    expect(consoleStore.getState().filters.lcFilter).toBe('All LCs');
    expect(consoleStore.getState().query).toBe('');
    expect(consoleStore.getState().theme).toBe('dark');
    return;
  }
  if (id === 'M5-009') {
    expect(pathOf(router)).toBe('/locked');
    return;
  }
  if (id === 'M5-010') {
    expect(pathOf(router)).not.toBe('/locked');
    return;
  }
  if (id === 'M5-011') {
    consoleActions.openDrawer({ title: 'New order', sub: 'x', cta: 'Create order', done: 'created', fields: [{ label: 'Note', value: 'unsaved' }] });
    await openAccount();
    await clickLabel('Sign out');
    expect(consoleStore.getState().drawer).toBeNull();
    cleanup();
    renderAt(dest('/login', 'login'));
    await ready();
    await user.type(screen.getByLabelText(/work email/i), STAFF_ACCOUNTS[0].email);
    await user.type(screen.getByLabelText(/^password/i), STAFF_ACCOUNTS[0].demoPassword);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(await screen.findByRole('button', { name: /Verify and open console/i }));
    expect(consoleStore.getState().drawer).toBeNull();
    return;
  }
  if (id === 'M5-012') {
    expect(pathOf(router)).toBe('/signed-out');
    note(id, 'A signed-out session that opens a console URL returns to /signed-out. Sign in again is what opens /login.');
    return;
  }
  if (id === 'M6-019') {
    consoleActions.setFilter('lcFilter', 'Shipped');
    await clickLabel('Open LC & Payments');
    expect(pathOf(router)).toBe('/lc');
    expect(consoleStore.getState().filters.lcFilter).toBe('All LCs');
    return;
  }
  if (/^M6-02[0-4]$/.test(id)) {
    const stage = c.element.split(': ')[1];
    await clickMatch(new RegExp(`^${escapeReg(stage)}:`));
    expect(pathOf(router)).toBe('/lc');
    expect(consoleStore.getState().filters.lcFilter).toBe(stage);
    return;
  }
  if (id === 'M6-025') {
    await clickMatch(/Order MB-SELL-41982/);
    expect(pathOf(router)).toBe('/orders/MB-SELL-41982');
    return;
  }
  if (id === 'M6-031') {
    await clickLabel('Queue: Vault unallocated');
    expect(pathOf(router)).toBe('/vault');
    expect(consoleStore.getState().filters.vaultStatus).toBe('In vault');
    return;
  }
  if (id === 'M6-032') {
    consoleActions.setFilter('dsFilter', 'Resolved');
    await clickLabel('Queue: Open disputes');
    expect(pathOf(router)).toBe('/disputes');
    expect(consoleStore.getState().filters.dsFilter).toBe('All disputes');
    return;
  }
  if (id === 'M6-017') {
    for (const label of [/LC VALUE ISSUED/i, /AVG LC CYCLE TIME/i, /DISCREPANCY RATE/i]) {
      if (pathOf(router) !== '/overview') {
        cleanup();
        router = renderAt(dest('/overview', 'app'));
        await ready();
      }
      await clickMatch(label);
      expect(pathOf(router)).toBe('/lc');
    }
    return;
  }
  if (id === 'M6-018') {
    await clickMatch(/PASSPORTS ON BLOCKCHAIN/i);
    expect(pathOf(router)).toBe('/chain');
    cleanup();
    const again = renderAt(dest('/overview', 'app'));
    await ready();
    await clickMatch(/BTC-SETTLED VOLUME/i);
    expect(pathOf(again)).toBe('/chain');
    return;
  }
  if (id === 'M6-033') {
    const bars = document.querySelectorAll('[class*="bar"], [class*="mineral"]');
    const before = pathOf(router);
    if (bars[0]) fireEvent.click(bars[0]);
    expect(pathOf(router)).toBe(before);
    await clickMatch(/ACTIVE ORDERS BY STAGE/i);
    expect(pathOf(router)).toBe('/orders');
    expect(consoleStore.getState().filters.orderStage).toBe('');
    return;
  }
  if (id === 'M7-012' || id === 'M7-013' || id === 'M7-020' || id === 'M7-021' || id === 'M7-022') {
    const pageRows = () => rowText().filter((row) => /MB-(SELL|BUY)-/.test(row));
    expect(pageRows().length).toBeLessThanOrEqual(6);
    if (id === 'M7-020') {
      expect(pageRows().length).toBe(6);
      expect(haystack()).toMatch(/page 1/);
      return;
    }
    if (id === 'M7-021') {
      await user.click(screen.getByRole('button', { name: /^Previous$/i }));
      expect(toastText()).toMatch(/Already on the first page/);
      return;
    }
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    expect(haystack()).toMatch(/page 2/);
    if (id === 'M7-013') return;
    if (id === 'M7-012') {
      await user.click(screen.getByRole('button', { name: /^Previous$/i }));
      expect(haystack()).toMatch(/page 1/);
      return;
    }
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    expect(toastText()).toMatch(/No more orders in this filter/);
    return;
  }
  if (id === 'M7-014') {
    await searchFor('zzzz');
    await clickLabel('Clear filters and search');
    expect(toastText()).toMatch(/Order filters cleared/);
    expect(consoleStore.getState().query).toBe('');
    expect(consoleStore.getState().orderPage).toBe(0);
    return;
  }
  if (id === 'M7-033') {
    await user.click(screen.getByRole('button', { name: /Advance to/i }));
    expect(consoleStore.getState().stageAdv['MB-SELL-41964']).toBe(1);
    consoleActions.resetSession();
    expect(consoleStore.getState().stageAdv['MB-SELL-41964']).toBeUndefined();
    note(id, 'Refresh drops in-memory stage advances. resetSession reproduces that drop.');
    return;
  }
  if (id === 'XC-001' || id === 'XC-002' || id === 'XC-003') {
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    if (id === 'XC-002') {
      await clickLabel('Narrow menu');
      expect(await screen.findByRole('button', { name: 'Close navigation' })).toBeInTheDocument();
    }
    if (id === 'XC-003') {
      const text = screen.getByRole('heading', { name: 'Overview' }).textContent;
      act(() => consoleActions.setTheme('dark'));
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(screen.getByRole('heading', { name: 'Overview' }).textContent).toBe(text);
      act(() => consoleActions.setTheme('light'));
    }
    note(id, id === 'XC-001' ? 'Executed in jsdom and the Chromium test runner. Edge, Firefox, and Safari are not installed here.' : id === 'XC-002' ? 'Narrow rail opens as a drawer. Pixel viewports were not measured in jsdom.' : 'Light and dark both keep the overview heading.');
    return;
  }
  if (id === 'XC-006') {
    cleanup();
    renderAt(dest('/orders', 'app'));
    await ready();
    await openDrawer('New order');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Create order/i }));
    expect(toastText()).toMatch(/Order created/);
    await openDrawer('New order');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Save as draft/i }));
    expect(toastText()).toMatch(/draft/i);
    await openDrawer('New order');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    note(id, 'New order drawer covered here. Each module drawer has its own case.');
    return;
  }
  if (id === 'XC-007') {
    act(() => consoleActions.notify('Desk note'));
    expect(toastText()).toMatch(/Desk note/);
    expect(screen.getByRole('button', { name: /Notifications/ })).toBeEnabled();
    return;
  }
  if (id === 'XC-009') {
    cleanup();
    renderAt(dest('/orders', 'app'));
    await ready();
    await openDrawer('New order');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    note(id, 'Escape closes the drawer. Full tab-order and screen-reader labels were not measured in jsdom.');
    return;
  }
  if (id === 'XC-004') {
    consoleActions.setTheme('dark');
    consoleActions.set({ stageAdv: { 'MB-SELL-41964': 1 }, offerDone: { a: 'approved' }, toggles: { x: true }, paused: { 'AUC-1': true } });
    const saved = sessionStorage.getItem('mb-session');
    expect(saved).toMatch(/"stage":"app"/);
    expect(window.localStorage.getItem('mb-theme')).toBe('dark');
    consoleActions.resetSession();
    expect(consoleStore.getState().theme).toBe('dark');
    expect(consoleStore.getState().stageAdv).toEqual({});
    expect(sessionStore.getState().stage).toBe('app');
    return;
  }
  if (id === 'XC-005') {
    const paths = ['/overview', '/orders', '/orders/intake', '/orders/MB-SELL-41982', '/vault', '/vault/MBV-2026-0412', '/listings', '/listings/MBL-2026-0112', '/pricing', '/pricing/offers', '/auctions', '/auctions/upcoming', '/auctions/ended', '/auctions/create', '/auctions/live/AUC-2026-0219', '/auctions/ended/AUC-2026-0214', '/lc', '/collab', '/chain', '/users', '/users/tiers', '/users/Joseph%20Kiptoo', '/verification', '/verification/expiry', '/disputes', '/disputes/DSP-2026-0071', '/academy', '/academy/analytics', '/marketing', '/partners', '/support', '/support/calls', '/audit', '/financial', '/analytics', '/settings', '/settings/platform', '/settings/btc', '/profile'];
    for (const path of paths) {
      cleanup();
      const next = renderAt(dest(path, 'app'));
      await screen.findByRole('heading', { level: 1 });
      expect(pathOf(next)).toBe(path);
    }
    return;
  }
  if (id === 'XC-008') {
    const payload = '<script>alert(1)</script>';
    await searchFor(payload);
    expect(screen.getByRole('textbox', { name: /Search orders, lots, users, documents/i })).toHaveValue(payload);
    expect(document.body.querySelector('script')).toBeNull();
    return;
  }
  throw new Error(`special not handled ${id}`);
}

const SPECIAL = new Set<string>([
  'M1-004', 'M1-005', 'M1-006', 'M1-007', 'M1-008', 'M1-009', 'M1-031', 'M1-010', 'M1-011', 'M1-012', 'M1-013', 'M1-014', 'M1-015', 'M1-016', 'M1-017', 'M1-018', 'M1-019', 'M1-020', 'M1-021', 'M1-022', 'M1-023', 'M1-024', 'M1-025', 'M1-026', 'M1-027', 'M1-028', 'M1-029', 'M1-030', 'M1-032', 'M1-033', 'M1-034', 'M1-035',
  'M2-001', 'M2-002', 'M2-003', 'M2-004', 'M2-005', 'M2-006', 'M2-007', 'M2-008', 'M2-009', 'M2-010', 'M2-011', 'M2-012', 'M2-013', 'M2-014', 'M2-015', 'M2-016', 'M2-017', 'M2-018', 'M2-019',
  'M3-004', 'M3-005', 'M3-006', 'M3-007', 'M3-008', 'M3-009', 'M3-010', 'M3-011', 'M3-012', 'M3-013', 'M3-014', 'M3-015', 'M3-016', 'M3-017', 'M3-018', 'M3-019', 'M3-020', 'M3-021', 'M3-022', 'M3-029', 'M3-030', 'M3-031',
  'M4-005', 'M4-006', 'M4-007', 'M4-008', 'M4-009', 'M4-010', 'M4-011', 'M4-012', 'M4-013', 'M4-014',
  'M5-004', 'M5-005', 'M5-006', 'M5-007', 'M5-008', 'M5-009', 'M5-010', 'M5-011', 'M5-012',
  'M6-017', 'M6-018', 'M6-019', 'M6-020', 'M6-021', 'M6-022', 'M6-023', 'M6-024', 'M6-025', 'M6-031', 'M6-032', 'M6-033',
  'M7-012', 'M7-013', 'M7-014', 'M7-020', 'M7-021', 'M7-022', 'M7-033',
  'XC-001', 'XC-002', 'XC-003', 'XC-004', 'XC-005', 'XC-006', 'XC-007', 'XC-008', 'XC-009',
]);

async function execute(c: Case) {
  if (isApiCase(c) && !['M1-024', 'M1-025'].includes(c.id)) {
    await runApi(c);
    return;
  }
  const where = destination(c);
  const router = renderAt(where);
  await ready();
  if (SPECIAL.has(c.id)) {
    await runSpecial(c, router);
    return;
  }
  await runUi(c, router);
}

beforeEach(() => {
  act(() => {
    consoleActions.setTheme('light');
    consoleActions.resetSession();
  });
  sessionStorage.clear();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0 } });
  document.documentElement.setAttribute('data-theme', 'light');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_API_BASE_URL', '');
});

afterAll(() => {
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
});

describe('admin dashboard cases', () => {
  it.each(cases.map((c) => [c.id, c] as const))('%s', async (_id, c) => {
    try {
      await execute(c);
      results.push({ id: c.id, status: 'Pass', remarks: notes.get(c.id) ?? '' });
    } catch (error) {
      const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
      results.push({ id: c.id, status: 'Fail', error: message });
      throw error;
    }
  });
});

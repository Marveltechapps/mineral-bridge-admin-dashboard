/* eslint-disable @typescript-eslint/no-explicit-any */
// The design's root component logic (state, toast, commit, go, openOrder, openDrawer, sign-in),
// rebuilt as a controller the engine calls as `c`. UI state (including the current screen) lives
// in the Zustand store, the working data set in the TanStack Query cache; the URL mirrors the screen.
import { MBA } from './registry';
import { consolePath } from '../../../constants/nav';
import { adminApi, AdminApiError } from '../../../lib/adminApi';
import { getConsoleDb, staffFromMe, type StaffMe } from '../../../services/console/consoleService';
import type { ConsoleController, ConsolePorts } from '../../../types/console';

const THEME_KEY = 'mb4-theme';

export function readStoredTheme(): 'light' | 'dark' {
  try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

export function createController(ports: ConsolePorts): ConsoleController {
  let cache: any = null, lastUi: any, lastDb: any;
  let sentAt = 0;
  let challengeId = '';
  const c: any = {
    form: {},
    get state() {
      const ui = ports.getUi(), db = ports.getDb();
      if (!cache || ui !== lastUi || db !== lastDb) {
        lastUi = ui; lastDb = db;
        // The design remembers which list an order was opened from; here that list is the
        // current screen, which stays put while an order is open.
        cache = Object.assign({}, ui, { db, back: ui.nav });
      }
      return cache;
    },
    setState(patch: any) {
      const p = typeof patch === 'function' ? patch(c.state) : patch;
      if (!p) return;
      const ui = Object.assign({}, p);
      delete ui.back; delete ui.db;
      if (Object.keys(ui).length) ports.setUi(ui);
      if ('db' in p) ports.setDb(p.db);
      if ('nav' in p || 'orderId' in p) { const s = ports.getUi(); ports.navigate(consolePath(s.nav, s.orderId)); }
    },
    toast(text: string) {
      const id = Date.now() + Math.random();
      c.setState((s: any) => ({ toasts: s.toasts.concat([{ id, text }]).slice(-3) }));
      setTimeout(() => c.setState((s: any) => ({ toasts: s.toasts.filter((x: any) => x.id !== id) })), 3600);
    },
    commit(msg?: string) { c.setState((s: any) => ({ rev: s.rev + 1 })); if (msg) c.toast(msg); },
    go(nav: string, extra?: any) { c.form = {}; c.setState(Object.assign({ nav, orderId: null, drawer: null, menu: false, q: '' }, extra || {})); },
    openOrder(id: string) { c.form = {}; c.setState({ orderId: id, drawer: null, menu: false }); },
    openDrawer(type: string, id: any, nav?: string) { c.form = {}; c.setState(Object.assign({ drawer: { type, id }, reply: '', menu: false }, nav ? { nav, orderId: null } : {})); },
    applyTheme(t: 'light' | 'dark') {
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem(THEME_KEY, t); } catch { /* storage unavailable: theme lasts for this visit */ }
      c.setState({ theme: t });
    },
    startLogin() {
      const st = c.state, id = (st.loginId || '').trim(), password = (st.loginPassword || '').trim();
      if (st.via !== 'email') return c.setState({ loginErr: 'Staff sign-in uses your work email and password.' });
      if (!id || !password) return c.setState({ loginErr: 'Enter your work email and password.' });
      void adminApi.post<StaffMe & { challengeId?: string; me?: StaffMe }>('auth/sign-in', { email: id, password })
        .then(async (body) => {
          if (body.challengeId) {
            challengeId = body.challengeId;
            sentAt = Date.now();
            c.setState({ auth: 'code', code: '', codeErr: '', loginErr: '' });
            return;
          }
          const me = body.me || body;
          const staff = staffFromMe(me);
          const role = Math.max(0, MBA.ROLES.findIndex((r: any) => r[0] === staff.key));
          const db = await getConsoleDb();
          c.form = {};
          c.setState({ auth: 'app', role, nav: 'overview', orderId: null, drawer: null, loginErr: '', db });
          c.toast('Signed in as ' + staff.name);
        })
        .catch((err: unknown) => {
          const message = err instanceof AdminApiError ? err.message : 'Could not reach the admin API.';
          c.setState({ loginErr: message });
        });
    },
    resendCode() {
      const wait = 30 - Math.floor((Date.now() - sentAt) / 1000);
      if (wait > 0) return c.toast('You can resend in ' + wait + ' s');
      if (!challengeId) return c.toast('Sign in again to request a new code');
      sentAt = Date.now();
      void adminApi.post('auth/otp/resend', { challengeId }).then(() => c.toast('New code sent')).catch((err: unknown) => {
        c.toast(err instanceof AdminApiError ? err.message : 'Could not resend the code');
      });
    },
    verify() {
      const st = c.state;
      if (!/^\d{4}$/.test(st.code)) return c.setState({ codeErr: 'Enter the 4-digit code.' });
      if (!challengeId) return c.setState({ codeErr: 'Sign in again.' });
      void adminApi.post<{ me: StaffMe }>('auth/otp/verify', { challengeId, code: st.code })
        .then(async (body) => {
          const staff = staffFromMe(body.me);
          const role = Math.max(0, MBA.ROLES.findIndex((r: any) => r[0] === staff.key));
          const db = await getConsoleDb();
          c.form = {};
          c.setState({ auth: 'app', role, nav: 'overview', orderId: null, drawer: null, codeErr: '', db });
          c.toast('Signed in as ' + staff.name);
        })
        .catch((err: unknown) => {
          c.setState({ codeErr: err instanceof AdminApiError ? err.message : 'Could not verify the code.' });
        });
    },
    signOut() {
      void adminApi.post('auth/sign-out').catch(() => undefined).finally(() => {
        challengeId = '';
        c.setState({ auth: 'login', loginId: '', loginPassword: '', code: '', menu: false, drawer: null, orderId: null });
        c.toast('Signed out');
      });
    },
  };
  return c;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// View models for the sign-in screen, the console shell, list pages, order detail and the drawer.
// Ported from the design's renderVals(); styles are the design's own inline styles.
import { MBA, MBV } from './registry';
import { consoleNavigation, consoleTitles } from '../../../constants/nav';
import type { ConsoleController, DrawerVM, OrderDetailVM, PageVM, ShellVM, SignInVM } from '../../../types/console';

const seg = (on: boolean) => 'flex:1; height:36px; border-radius:10px; border:none; cursor:pointer; font-size:12.5px; font-weight:700; background:' + (on ? 'var(--card)' : 'transparent') + '; color:' + (on ? 'var(--ink)' : 'var(--ink3)') + '; box-shadow:' + (on ? '0 1px 4px rgba(20,26,46,.12)' : 'none') + ';';
const err = (t: string) => t ? 'display:block; padding:10px 12px; border-radius:12px; background:var(--errBg); color:var(--errInk); font-size:12px; font-weight:700; animation:mbUp .2s ease;' : 'display:none;';

export function signInView(c: ConsoleController): SignInVM {
  const st: any = c.state, A = MBA, V = MBV, email = st.via === 'email', r = A.ROLES[st.pending];
  return {
    loginStep: st.auth === 'login', codeStep: st.auth === 'code',
    lg: {
      tabE: seg(email), tabW: seg(!email),
      viaEmail: () => c.setState({ via: 'email', loginId: '', loginErr: '' }),
      viaWa: () => c.setState({ via: 'whatsapp', loginId: '', loginErr: '' }),
      fieldLabel: email ? 'WORK EMAIL' : 'WHATSAPP NUMBER', placeholder: email ? 'name@mineralbridge.com' : '+234 803 100 2001',
      id: st.loginId, setId: (e: any) => c.setState({ loginId: e.target.value, loginErr: '' }),
      showPassword: email, password: st.loginPassword || '', setPassword: (e: any) => c.setState({ loginPassword: e.target.value, loginErr: '' }),
      err: st.loginErr, errStyle: err(st.loginErr), go: () => c.startLogin(), submit: 'Sign in',
      accounts: email ? A.ROLES.map((x: any) => ({ role: x[1] + ' · ' + x[2], id: x[3], go: () => c.setState({ loginId: x[3], loginPassword: '', loginErr: '' }) })).filter((a: any) => a.id) : [],
    },
    cd: {
      sent: 'We sent a 4-digit code ' + (email ? 'to ' + r[3] : 'on WhatsApp to ' + V.WA(st.pending)) + '.', who: r[2], role: r[1],
      code: st.code, set: (e: any) => c.setState({ code: e.target.value.replace(/\D/g, '').slice(0, 4), codeErr: '' }),
      err: st.codeErr, errStyle: err(st.codeErr), verify: () => c.verify(),
      back: () => c.setState({ auth: 'login', code: '' }), resend: () => c.resendCode(),
    },
  };
}

const openForMb = (o: any) => { const n = MBA.nextInfo(o); return n.mb && !n.done; };

export function shellView(c: ConsoleController): ShellVM {
  const A = MBA, V = MBV, st: any = c.state, db = st.db, me = V.me(c), now = Date.now();
  const counts: Record<string, number> = {
    buy: db.orders.filter((o: any) => o.kind === 'buy' && openForMb(o)).length,
    sell: db.orders.filter((o: any) => o.kind === 'sell' && openForMb(o)).length,
    auctions: db.auctions.filter((a: any) => V.auSt(a, now) === 'Live').length,
    customers: db.kyc.filter((k: any) => k.status === 'pending').length,
    support: db.threads.filter((t: any) => t.unread).length,
    refunds: db.refunds.filter((r: any) => ['requested', 'review', 'approved', 'processing'].indexOf(r.status) >= 0).length,
    notifications: db.deliveries.filter((d: any) => d.status === 'failed').length,
  };
  const wide = !st.narrow;
  const o = st.orderId ? db.orders.find((x: any) => x.id === st.orderId) : null;
  const t = consoleTitles[st.nav] || consoleTitles.overview!;
  const dark = st.theme === 'dark';
  return {
    me: Object.assign({}, me, { initials: me.name.split(' ').map((s: string) => s[0]).join(''), first: me.name.split(' ')[0] }),
    sd: {
      wide,
      style: 'width:' + (wide ? 244 : 72) + 'px; flex-shrink:0; position:sticky; top:0; height:100vh; display:flex; flex-direction:column; background:linear-gradient(180deg,var(--side1),var(--side2)); color:#fff; transition:width .2s ease;',
      groups: consoleNavigation.map(g => ({
        label: g.label,
        items: g.items.map(it => {
          const on = st.nav === it.key, b = counts[it.key];
          return {
            key: it.key, label: it.label, icon: it.icon, badge: b ? String(b) : '',
            badgeStyle: b ? 'min-width:19px; height:18px; padding:0 6px; border-radius:9px; background:' + (on ? 'rgba(255,255,255,.2)' : 'rgba(247,221,142,.18)') + '; color:' + (on ? '#fff' : '#F3D27A') + '; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center;' + (wide ? '' : ' position:absolute; top:3px; right:5px;') : 'display:none;',
            style: 'position:relative; display:flex; align-items:center; gap:10px; width:100%; padding:9px ' + (wide ? '11px' : '0') + '; justify-content:' + (wide ? 'flex-start' : 'center') + '; border-radius:11px; border:none; cursor:pointer; font-size:12.5px; font-weight:' + (on ? 700 : 600) + '; color:' + (on ? '#fff' : 'rgba(255,255,255,.75)') + '; background:' + (on ? 'rgba(255,255,255,.13)' : 'transparent') + '; box-shadow:' + (on ? 'inset 0 0 0 1px rgba(247,221,142,.3)' : 'none') + '; transition:background .15s ease;',
            go: () => c.go(it.key),
          };
        }),
      })),
    },
    hd: {
      title: o ? o.id : t[0], sub: o ? (o.kind === 'sell' ? 'Sell request' : 'Buy order') + ' · ' + A.nextInfo(o).label : t[1],
      q: st.q, setQ: (e: any) => c.setState({ q: e.target.value }),
      theme: () => c.applyTheme(dark ? 'light' : 'dark'), themeIcon: dark ? 'sun' : 'moon', themeText: dark ? 'Light' : 'Dark', themeLabel: 'Switch to ' + (dark ? 'light' : 'dark') + ' mode',
      menu: st.menu, toggleMenu: () => c.setState({ menu: !c.state.menu }), signOut: () => c.signOut(),
    },
    screenKey: st.nav + '|' + (st.orderId || '') + '|' + JSON.stringify(st.tab[st.nav] || ''),
  };
}

/** The order the URL points at, or null when it does not exist (deleted, or a mistyped link). */
export function currentOrder(c: ConsoleController): unknown {
  const st: any = c.state;
  return (st.orderId && st.db && st.db.orders.find((x: any) => x.id === st.orderId)) || null;
}

export function pageView(c: ConsoleController): PageVM {
  const pg = MBV.page(c);
  pg.hasTable = !!pg.table;
  pg.hasChipsOrTools = pg.hasChips || pg.hasTools;
  if (!pg.table) pg.table = { cols: [], rows: [] };
  if (!pg.settings) pg.settings = { groups: [], methods: [], save: {}, reset: {} };
  return pg;
}

export function orderView(c: ConsoleController, o: unknown): OrderDetailVM {
  const st: any = c.state;
  return Object.assign(MBV.orderDetail(c, o), {
    back: () => c.setState({ orderId: null, nav: st.back || st.nav }),
    backLabel: 'Back to ' + (consoleTitles[st.back || st.nav] || consoleTitles.overview!)[0],
  });
}

export function drawerView(c: ConsoleController): DrawerVM {
  return MBV.drawer(c);
}

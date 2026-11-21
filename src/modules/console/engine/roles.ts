/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-roles.js. Behaviour and styles are kept as designed.
import { MBA, MBV } from './registry';

const V = MBV, D = V.D;
const PERM_LIST: any[] = [
  ['ops', 'Operations', 'Order desk', 'Accept or reject buy orders, review sell requests, request changes, accept seller details, give final approval, resolve delivery discrepancies, complete orders', 'Buy orders, Sell requests'],
  ['trading', 'Trading', 'Pricing & contracts', 'Issue and revise quotations, confirm prices, countersign e-contracts', 'Buy orders, Sell requests'],
  ['auction', 'Trading', 'Auctions', 'Schedule, open early, pause, extend, cancel, close and award auctions; relist unsold lots', 'Auctions'],
  ['kyc', 'Compliance', 'KYC decisions', 'Approve, reject or request new KYC documents', 'Customers & KYC'],
  ['suspend', 'Compliance', 'Account suspension', 'Suspend and reinstate customer accounts', 'Customers & KYC'],
  ['inspection', 'Inspection', 'Inspections & testing', 'Schedule inspections, record weights and seals, upload SGS reports, answer report queries, manage testing agencies', 'Sell requests, Inspections, Logistics'],
  ['finance', 'Finance', 'Payments, payouts & refunds', 'Confirm incoming payments, approve and release seller payouts, review, approve, decline and complete refunds', 'Payments & payouts, Refunds'],
  ['logistics', 'Logistics', 'Shipments', 'Assign logistics partners, record pickup, transit, delivery and vault receipt; pause or reactivate carriers', 'Buy orders, Sell requests, Logistics'],
  ['catalogue', 'Catalogue', 'Lots & categories', 'Create and edit lots, publish and archive them, manage categories and subcategories', 'Catalogue'],
  ['support', 'Support', 'Customer conversations', 'Reply to customers, assign and resolve threads, retry failed notifications', 'Support, Notifications'],
  ['remind', 'Support', 'Customer reminders', 'Send reminders when a step is waiting on the customer', 'All order screens'],
  ['settings', 'Administration', 'Platform administration', 'Change configuration and payment methods, edit document templates, invite and disable admins, change these permissions', 'Settings, Documents']
];
V.PERM_LIST = PERM_LIST;
V.perms = (db?: any) => { if (!db.perms) { db.perms = {}; Object.keys(MBA.PERMS).forEach(k => { db.perms[k] = MBA.PERMS[k].slice(); }); } return db.perms; };
V.can = (c?: any, p?: any) => { const k = V.me(c).key; if (k === 'super') return true; return (V.perms(c.state.db)[k] || []).indexOf(p) >= 0; };
const has = (db?: any, role?: any, p?: any) => role === 'super' || (V.perms(db)[role] || []).indexOf(p) >= 0;
const ROLES = () => MBA.ROLES;
const short: any = { super: 'SUPER', ops: 'OPS', trading: 'TRADE', compliance: 'COMPL', inspection: 'INSP', finance: 'FIN', logistics: 'LOGI', catalogue: 'CAT', support: 'SUPP' };
const toggle = (c?: any, role?: any, p?: any) => {
  if (!V.can(c, 'settings')) return c.toast('Needs Super admin');
  if (role === 'super') return c.toast('Super admin always has every permission');
  const db = c.state.db, list = V.perms(db)[role] = V.perms(db)[role] || [], i = list.indexOf(p), name = PERM_LIST.find(x => x[0] === p)[2];
  if (i >= 0) list.splice(i, 1); else list.push(p);
  V.log(c, 'Admin', V.roleLabel(role), 'Permission ' + (i >= 0 ? 'removed' : 'granted'), i >= 0 ? name : '', i >= 0 ? '' : name);
  c.commit(V.roleLabel(role) + (i >= 0 ? ' can no longer: ' : ' can now: ') + name);
  if (db.live && V.persistRole) V.persistRole(c, role, { actions: list.slice() });
};
V.rolesView = (c?: any) => {
  const db = c.state.db, view = (c.state.chip.roles || 'By permission');
  const chips = V.chips(c, 'roles', ['By permission', 'By role']);
  if (view === 'By role') {
    const list = ROLES().filter((r?: any) => V.match(c, [r[1], r[2]]));
    return { chips: chips.list, table: V.table(c, 'rolesR', [['ROLE', '1.3fr', (r?: any) => r[1]], ['PEOPLE', '1.3fr'], ['CAN DO', '3fr'], ['COUNT', '.6fr', (r?: any) => r[0] === 'super' ? 99 : (V.perms(db)[r[0]] || []).length]], list, (r?: any) => {
      const ps = r[0] === 'super' ? PERM_LIST : PERM_LIST.filter(p => has(db, r[0], p[0]));
      const people = db.admins.filter((a?: any) => a.role === r[0]);
      return { cells: [{ t: r[1], s: r[0], b: 1 }, { t: people.map((a?: any) => a.name).join(', ') || 'Nobody assigned', s: people.length + (people.length === 1 ? ' admin' : ' admins') }, { t: r[0] === 'super' ? 'Everything' : ps.map(p => p[2]).join(', ') || 'View only', s: r[0] === 'super' ? 'Cannot be restricted' : '' }, { t: r[0] === 'super' ? 'All' : ps.length + ' of ' + PERM_LIST.length }], go: () => c.openDrawer('role', r[0]) };
    }) };
  }
  const list = PERM_LIST.filter(p => V.match(c, [p[1], p[2], p[3], p[4]]));
  const cols = [['PERMISSION', '2.4fr', (p?: any) => p[1] + p[2]]].concat(ROLES().map((r?: any) => [short[r[0]] || r[0].toUpperCase(), '.62fr']));
  return { chips: chips.list, table: V.table(c, 'rolesP', cols, list, (p?: any) => ({ cells: [{ t: p[2], s: p[1] + ' · ' + p[4], b: 1 }].concat(ROLES().map((r?: any) => { const on = has(db, r[0], p[0]); return { t: on ? 'Yes' : '—', pill: on ? (r[0] === 'super' ? 'gold' : 'ok') : 'mute' }; })), go: () => c.openDrawer('perm', p[0]) }), { title: 'What each role can do', note: '' }) };
};
D.perm = (c?: any, id?: any) => {
  const db = c.state.db, p = PERM_LIST.find(x => x[0] === id), can = V.can(c, 'settings');
  return { title: p[2], sub: p[1] + ' · used in ' + p[4], pill: ROLES().filter((r?: any) => has(db, r[0], id)).length + ' roles', pillStyle: V.pill('info'),
    fields: [{ k: 'Allows', v: p[3] }, { k: 'Key', v: p[0] }, { k: 'Without it', v: 'The role can view these screens, but the action buttons are locked and say which role is needed' }],
    sections: [{ title: can ? 'Roles · click to grant or remove' : 'Roles · read only', items: ROLES().map((r?: any) => { const on = has(db, r[0], id); return { t: r[1], s: db.admins.filter((a?: any) => a.role === r[0]).map((a?: any) => a.name).join(', ') || 'Nobody assigned', r: r[0] === 'super' ? 'Always' : on ? 'Allowed' : 'Not allowed', pill: true, pillStyle: V.pill(r[0] === 'super' ? 'gold' : on ? 'ok' : 'mute'), go: () => toggle(c, r[0], id) }; }) }],
    inputs: [], actions: [] };
};
D.role = (c?: any, key?: any) => {
  const db = c.state.db, r = ROLES().find((x?: any) => x[0] === key), can = V.can(c, 'settings');
  const people = db.admins.filter((a?: any) => a.role === key);
  const limits = [];
  if (has(db, key, 'finance')) limits.push({ k: 'Payout approval', v: 'Can approve; above ' + MBA.money(db.settings.payoutApprover) + ' needs a second finance approver' }, { k: 'Refund approval', v: 'Can approve; above ' + MBA.money(db.settings.refundApprover) + ' needs a second finance approver' });
  return { title: r[1], sub: people.map((a?: any) => a.name).join(', ') || 'Nobody assigned', pill: key === 'super' ? 'all permissions' : (V.perms(db)[key] || []).length + ' of ' + PERM_LIST.length, pillStyle: V.pill(key === 'super' ? 'gold' : 'info'),
    fields: [{ k: 'Sees', v: 'Every module (read only where a permission is missing)' }, { k: 'Signs in with', v: '4-digit code by email or WhatsApp' }].concat(limits).concat(key === 'super' ? [{ k: 'Restrictions', v: 'None — this role cannot be limited' }] : []),
    sections: [{ title: key === 'super' ? 'Permissions' : can ? 'Permissions · click to grant or remove' : 'Permissions · read only', items: PERM_LIST.map(p => { const on = has(db, key, p[0]); return { t: p[2], s: p[3], r: key === 'super' ? 'Always' : on ? 'Allowed' : 'Not allowed', pill: true, pillStyle: V.pill(key === 'super' ? 'gold' : on ? 'ok' : 'mute'), go: () => toggle(c, key, p[0]) }; }) }, { title: 'Admins with this role', items: people.map((a?: any) => ({ t: a.name, s: a.email + ' · ' + a.status, go: () => c.openDrawer('admin', a.id) })) }],
    inputs: [], actions: key === 'super' || !can ? [] : [{ label: 'Reset to default', style: V.B[2], go: () => { if (db.live && V.persistRole) { V.persistRole(c, key, { reset: true }, r[1] + ' reset to default permissions'); return; } V.perms(db)[key] = (MBA.PERMS[key] || []).slice(); V.log(c, 'Admin', r[1], 'Permissions reset to default'); c.commit(r[1] + ' reset to default permissions'); } }] };
};
const adminD = D.admin;
D.admin = (c?: any, id?: any) => { const v = adminD(c, id), a = c.state.db.admins.find((x?: any) => x.id === id); v.fields = v.fields.filter((f?: any) => f.k !== 'Can do').concat([{ k: 'Can do', v: a.role === 'super' ? 'Everything' : PERM_LIST.filter(p => has(c.state.db, a.role, p[0])).map(p => p[2]).join(', ') || 'View only' }]); v.actions = v.actions.concat([{ label: 'View role permissions', style: V.B[2], go: () => c.openDrawer('role', a.role) }]); return v; };

/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-views.js. Behaviour and styles are kept as designed.
import { createElement } from 'react';
import { MBA, MBV } from './registry';
import { consoleNavigation, consoleTitles } from '../../../constants/nav';

const V = MBV;
const TONE: any = { ok: ['var(--okBg)', 'var(--okInk)'], warn: ['var(--warnBg)', 'var(--warnInk)'], err: ['var(--errBg)', 'var(--errInk)'], info: ['var(--infoBg)', 'var(--infoInk)'], mute: ['var(--muteBg)', 'var(--muteInk)'], gold: ['var(--goldBg)', 'var(--goldInk)'] };
V.pill = (t?: any) => { const c = TONE[t] || TONE.mute; return 'display:inline-flex; align-items:center; align-self:flex-start; padding:3px 9px; border-radius:999px; background:' + c[0] + '; color:' + c[1] + '; font-size:10.5px; font-weight:800; letter-spacing:.3px; white-space:normal; max-width:100%; line-height:1.35; overflow-wrap:break-word;'; };
const BTN = 'height:36px; padding:0 14px; border-radius:12px; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:7px; transition:background .15s ease, border-color .15s ease, transform .12s ease; white-space:nowrap;';
V.B = { 1: BTN + 'border:none; background:var(--btn); color:#fff;', 2: BTN + 'border:1px solid var(--line); background:var(--card); color:var(--ink);', 3: BTN + 'border:1px solid var(--errBg); background:var(--errBg); color:var(--errInk);', 4: BTN + 'border:1px solid var(--okBg); background:var(--okBg); color:var(--okInk);', off: BTN + 'border:1px dashed var(--line); background:transparent; color:var(--ink3); cursor:not-allowed;' };
// Sidebar groups and screen titles live in constants/nav.ts; the engine keeps its tuple form.
V.NAV = consoleNavigation.map(g => [g.label, g.items.map(i => [i.key, i.label, i.icon])]);
V.TITLES = Object.fromEntries(Object.entries(consoleTitles).map(([k, t]) => [k, [t[0], t[1]]]));
const ICONS: any = {
  grid: [['rect', 3, 3, 7, 7], ['rect', 14, 3, 7, 7], ['rect', 14, 14, 7, 7], ['rect', 3, 14, 7, 7]],
  cart: [['path', 'M6 6h15l-1.5 9h-12z'], ['path', 'M6 6L5 3H2'], ['circle', 9, 20, 1.5], ['circle', 18, 20, 1.5]],
  box: [['path', 'M21 8v8l-9 5-9-5V8l9-5z'], ['path', 'M3.3 7.5L12 12.5l8.7-5'], ['path', 'M12 22V12.5']],
  gavel: [['path', 'M14 11l-8.5 8.5a2.1 2.1 0 0 1-3-3L11 8'], ['path', 'M12 6l6 6'], ['path', 'M9 3l12 12'], ['path', 'M14 21h7']],
  users: [['path', 'M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'], ['circle', 9.5, 7, 4], ['path', 'M22 21v-2a4 4 0 0 0-3-3.87']],
  chat: [['path', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']],
  bell: [['path', 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9'], ['path', 'M13.7 21a2 2 0 0 1-3.4 0']],
  layers: [['path', 'M12 2l10 5-10 5L2 7z'], ['path', 'M2 17l10 5 10-5'], ['path', 'M2 12l10 5 10-5']],
  shield: [['path', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'], ['path', 'M9 11.5l2.2 2.2L15.5 9.5']],
  truck: [['path', 'M1 4h14v12H1z'], ['path', 'M15 8h4l4 4v4h-8z'], ['circle', 5.5, 18.5, 2.2], ['circle', 18.5, 18.5, 2.2]],
  card: [['rect', 2, 5, 20, 14], ['path', 'M2 10h20']],
  undo: [['path', 'M9 14L4 9l5-5'], ['path', 'M4 9h11a5 5 0 0 1 0 10h-3']],
  doc: [['path', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'], ['path', 'M14 2v6h6']],
  list: [['path', 'M8 6h13'], ['path', 'M8 12h13'], ['path', 'M8 18h13'], ['path', 'M3 6h.01'], ['path', 'M3 12h.01'], ['path', 'M3 18h.01']],
  sliders: [['path', 'M4 21v-7'], ['path', 'M4 10V3'], ['path', 'M12 21v-9'], ['path', 'M12 8V3'], ['path', 'M20 21v-5'], ['path', 'M20 12V3'], ['path', 'M1 14h6'], ['path', 'M9 8h6'], ['path', 'M17 16h6']],
  search: [['circle', 11, 11, 8], ['path', 'M21 21l-4.3-4.3']],
  sun: [['circle', 12, 12, 4], ['path', 'M12 2v2'], ['path', 'M12 20v2'], ['path', 'M4.9 4.9l1.4 1.4'], ['path', 'M17.7 17.7l1.4 1.4'], ['path', 'M2 12h2'], ['path', 'M20 12h2'], ['path', 'M4.9 19.1l1.4-1.4'], ['path', 'M17.7 6.3l1.4-1.4']],
  moon: [['path', 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z']],
  x: [['path', 'M18 6L6 18'], ['path', 'M6 6l12 12']],
  arrowL: [['path', 'M19 12H5'], ['path', 'M12 19l-7-7 7-7']],
  check: [['path', 'M20 6L9 17l-5-5']],
  logout: [['path', 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'], ['path', 'M16 17l5-5-5-5'], ['path', 'M21 12H9']]
};
V.svg = (name?: any, size?: any) => createElement('svg', { width: size || 17, height: size || 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, (ICONS[name] || []).map((s?: any, i?: any) => s[0] === 'circle' ? createElement('circle', { key: i, cx: s[1], cy: s[2], r: s[3] }) : s[0] === 'rect' ? createElement('rect', { key: i, x: s[1], y: s[2], width: s[3], height: s[4], rx: 2 }) : createElement('path', { key: i, d: s[1] })));
V.WA = (i?: any) => '+234 803 100 20' + String(i + 1).padStart(2, '0');
V.chip = (on?: any) => 'padding:7px 13px; border-radius:999px; border:1px solid ' + (on ? 'var(--btn)' : 'var(--line)') + '; background:' + (on ? 'var(--btn)' : 'var(--card)') + '; color:' + (on ? '#fff' : 'var(--ink2)') + '; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; transition:background .15s ease, border-color .15s ease;';
V.tab = (on?: any) => 'white-space:nowrap; flex-shrink:0; padding:0 2px 11px; border:none; background:none; cursor:pointer; font-size:13.5px; font-weight:700; color:' + (on ? 'var(--ink)' : 'var(--ink3)') + '; border-bottom:2px solid ' + (on ? 'var(--btn)' : 'transparent') + '; margin-bottom:-1px; transition:color .15s ease;';

// ---- helpers bound to the component ----
V.me = (c?: any) => { const r = MBA.ROLES[c.state.role]; return { key: r[0], label: r[1], name: r[2], email: r[3] }; };
V.can = (c?: any, p?: any) => { const k = V.me(c).key; return k === 'super' || (MBA.PERMS[k] || []).indexOf(p) >= 0; };
V.roleLabel = (key?: any) => (MBA.ROLES.find((r?: any) => r[0] === key) || [])[1] || '';
V.log = (c?: any, entity?: any, eid?: any, action?: any, before?: any, after?: any, note?: any) => { const m = V.me(c); c.state.db.audit.unshift({ at: Date.now(), actor: m.name, role: m.label, entity, eid, action, before: before == null ? '' : String(before), after: after == null ? '' : String(after), note: note || '', ip: '102.89.34.12' }); };
V.tell = (c?: any, custId?: any, event?: any, ref?: any) => { const cu = MBA.cust(c.state.db, custId); ['email', 'sms', 'whatsapp', 'push'].forEach(ch => { if (cu.prefs && cu.prefs[ch]) c.state.db.deliveries.unshift({ at: Date.now(), cust: custId, event, ref, channel: ch, status: 'sent' }); }); };
V.val = (c?: any, k?: any, d?: any) => (c.form[k] != null && String(c.form[k]).trim() !== '' ? c.form[k] : d);
V.inp = (c?: any, k?: any, label?: any, d?: any, area?: any) => ({
  label,
  value: c.form[k] != null ? String(c.form[k]) : (d == null ? '' : String(d)),
  set: (e?: any) => { c.form[k] = e.target.value; },
  isArea: !!area,
  isText: !area,
});
V.act = (c?: any, label?: any, fn?: any, kind?: any, perm?: any) => {
  if (perm && !V.can(c, perm)) return { label, style: V.B.off, go: () => c.toast('Needs ' + (MBA.PERM_ROLE[perm] || perm) + ' — you are signed in as ' + V.me(c).label) };
  return { label, style: V.B[kind || 2], go: fn };
};
V.match = (c?: any, arr?: any) => { const q = (c.state.q || '').trim().toLowerCase(); if (!q) return true; return arr.some((x?: any) => x != null && String(x).toLowerCase().indexOf(q) >= 0); };

// ---- generic table ----
const CELL = { base: 'font-size:12.5px; font-weight:600; color:var(--ink); overflow:hidden; text-overflow:ellipsis;', sub: 'font-size:11px; font-weight:600; color:var(--ink3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;' };
V.cell = (x?: any) => {
  if (x == null || typeof x !== 'object') x = { t: x == null ? '—' : x };
  const tone = x.tone === 'err' ? 'var(--errInk)' : x.tone === 'warn' ? 'var(--warnInk)' : x.tone === 'ok' ? 'var(--okInk)' : null;
  return {
    text: x.t == null || x.t === '' ? '—' : String(x.t), sub: x.s || '',
    style: x.btns && (x.t == null || x.t === '') ? 'display:none;' : x.pill ? V.pill(x.pill) : CELL.base + (x.id ? ' font-weight:800; color:var(--brandInk);' : '') + (x.b ? ' font-weight:800;' : '') + (x.mono ? " font-family:ui-monospace,Menlo,monospace; font-size:11.5px;" : '') + (tone ? ' color:' + tone + ';' : '') + (x.r ? ' text-align:right;' : ''),
    subStyle: x.s ? CELL.sub + (x.r ? ' text-align:right;' : '') : 'display:none;',
    wrapStyle: 'display:flex; flex-direction:column; gap:2px; min-width:0;' + (x.r ? ' align-items:flex-end;' : ''),
    hasBtns: !!(x.btns && x.btns.length), btns: (x.btns || []).map((b?: any) => ({ label: b.label, go: (e?: any) => { if (e && e.stopPropagation) e.stopPropagation(); b.go(); }, style: 'height:28px; padding:0 10px; border-radius:9px; border:1px solid ' + (b.danger ? 'var(--errBg)' : 'var(--line)') + '; background:' + (b.danger ? 'var(--errBg)' : 'var(--card)') + '; color:' + (b.danger ? 'var(--errInk)' : 'var(--ink)') + '; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap;' }))
  };
};
V.table = (c?: any, id?: any, cols?: any, items?: any, row?: any, opt?: any) => {
  opt = opt || {};
  const s = c.state.sort[id] || {};
  let list = items.slice();
  if (s.i != null && cols[s.i] && cols[s.i][2]) { const f = cols[s.i][2]; list.sort((a?: any, b?: any) => { const x = f(a), y = f(b); return (x > y ? 1 : x < y ? -1 : 0) * (s.d || 1); }); }
  const total = list.length, pageSize = opt.cap || 25;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(pages, Math.max(1, (c.state.tablePage && c.state.tablePage[id]) || 1));
  list = list.slice((cur - 1) * pageSize, cur * pageSize);
  const setPage = (n: number) => c.setState((st?: any) => ({ tablePage: Object.assign({}, st.tablePage, { [id]: n }) }));
  const grid = ' grid-template-columns:' + cols.map((k?: any) => k[1]).join(' ') + ';';
  return {
    title: opt.title || '', hasTitle: !!opt.title, note: opt.note || '',
    head: 'display:grid; gap:12px; align-items:center; padding:11px 20px; background:var(--soft); border-bottom:1px solid var(--line); font-size:10px; font-weight:800; letter-spacing:1px; color:var(--ink3);' + grid,
    cols: cols.map((k?: any, i?: any) => ({ label: k[0], arrow: k[2] ? (s.i === i ? (s.d > 0 ? ' ↑' : ' ↓') : ' ↕') : '', go: k[2] ? () => c.setState((st?: any) => { const cur = st.sort[id] || {}; return { sort: Object.assign({}, st.sort, { [id]: { i, d: cur.i === i ? -(cur.d || 1) : 1 } }) }; }) : () => {}, style: 'display:flex; align-items:center; gap:3px; padding:0; border:none; background:none; font:inherit; letter-spacing:inherit; text-align:left; color:' + (s.i === i ? 'var(--ink)' : 'inherit') + '; cursor:' + (k[2] ? 'pointer' : 'default') + ';' + (k[3] ? ' justify-content:flex-end;' : '') })),
    rows: list.map((it?: any) => { const r = row(it); return { cells: r.cells.map(V.cell), go: r.go || (() => {}), style: 'display:grid; gap:12px; align-items:center; padding:12px 20px; border-bottom:1px solid var(--line2); cursor:' + (r.go ? 'pointer' : 'default') + '; transition:background .15s ease;' + (r.hl ? ' background:var(--hl);' : '') + grid }; }),
    empty: total === 0, emptyText: opt.empty || 'Nothing matches this filter or search.',
    count: total + (total === 1 ? ' record' : ' records') + (pages > 1 ? ' · page ' + cur + ' of ' + pages : ''),
    hasPager: pages > 1,
    pagerPrev: () => { if (cur > 1) setPage(cur - 1); },
    pagerNext: () => { if (cur < pages) setPage(cur + 1); }
  };
};
V.chips = (c?: any, id?: any, labels?: any, counts?: any) => {
  const cur = c.state.chip[id] || labels[0];
  return { cur, list: labels.map((l?: any, i?: any) => ({ label: l + (counts && counts[i] != null ? ' · ' + counts[i] : ''), style: V.chip(cur === l), go: () => c.setState((st?: any) => ({ chip: Object.assign({}, st.chip, { [id]: l }) })) })) };
};
V.tabs = (c?: any, id?: any, labels?: any) => {
  const cur = c.state.tab[id] || labels[0];
  return { cur, list: labels.map((l?: any) => ({ label: l, style: V.tab(cur === l), go: () => c.setState((st?: any) => ({ tab: Object.assign({}, st.tab, { [id]: l }), drawer: null })) })) };
};

// ---- orders ----
V.itemsText = (db?: any, o?: any) => o.kind === 'sell' ? o.sell.name + ' · ' + MBA.qfmt(o.sell.qty, o.sell.unit) : o.items.map((i?: any) => { const l = MBA.lot(db, i.lot) || {}; return (l.name || i.lot) + ' · ' + MBA.qfmt(i.qty, l.unit || ''); }).join(', ');
V.status = (o?: any, n?: any) => n.done ? (o.rejected ? 'Rejected' : o.refundedFull ? 'Refunded' : 'Completed') : o.hold ? 'On hold' : n.mb ? 'Needs Mineral Bridge' : 'Waiting on customer';
V.orderRow = (c?: any, o?: any) => {
  const db = c.state.db, cu = MBA.cust(db, o.cust), n = MBA.nextInfo(o), age = Date.now() - o.sAt, over = !n.done && n.mb && age > 24 * MBA.H;
  return {
    hl: over,
    cells: [{ t: o.id, s: o.src !== 'direct' ? 'Won at ' + o.src : '', id: 1 }, { t: MBA.cname(cu), s: cu.country }, { t: V.itemsText(db, o) }, { t: o.total ? MBA.money(o.total) : 'Not quoted', b: !!o.total, tone: o.total ? null : 'warn' }, { t: n.label, pill: n.tone }, { t: n.done ? '—' : MBA.OWNER[n.owner], s: n.role ? V.roleLabel(n.role) : '' }, { t: n.done ? '—' : MBA.ago(age), tone: over ? 'err' : null, b: over, s: over ? 'Over 24 h' : '' }, { t: MBA.date(o.at) }],
    go: () => c.openOrder(o.id)
  };
};
V.orderCols = (kind?: any) => [[kind === 'sell' ? 'REQUEST' : 'ORDER', '1.25fr', (o?: any) => o.id], ['CUSTOMER', '1.3fr', (o?: any) => o.cust], [kind === 'sell' ? 'MATERIAL' : 'ITEMS', '1.6fr'], ['VALUE', '.9fr', (o?: any) => o.total || 0], ['NEXT STEP', '1.45fr', (o?: any) => o.stage], ['OWNER', '1.05fr'], ['IN STEP', '.75fr', (o?: any) => o.sAt], ['CREATED', '.8fr', (o?: any) => o.at]];
V.orderChip = (o?: any, chip?: any) => { const n = MBA.nextInfo(o); if (chip === 'All') return true; return V.status(o, n) === chip || (chip === 'On hold' && !!o.hold && !n.done); };

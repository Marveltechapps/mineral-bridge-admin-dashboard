/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-pages.js. Behaviour and styles are kept as designed.
import { getConsoleDb } from '../../../services/console/consoleService';
import { MBA, MBV } from './registry';

const V = MBV;
const auSt = (a?: any, now?: any) => a.cancelled ? 'Cancelled' : (a.closed || a.closes <= now) ? 'Closed' : a.opens > now ? 'Upcoming' : a.paused ? 'Paused' : 'Live';
V.auSt = auSt;
const top = (a?: any) => a && Array.isArray(a.bids) && a.bids.length ? a.bids[a.bids.length - 1] : null;
const bidCount = (a?: any) => a && Array.isArray(a.bids) ? a.bids.length : 0;
const lotBits = (db?: any, a?: any) => {
  const l = MBA.lot(db, a && a.lot);
  return { l, name: MBA.lotName(db, a && a.lot, a && (a.name || a.lot || a.id)), grade: l && l.grade ? l.grade : '', unit: l && l.unit ? l.unit : '' };
};
V.top = top;
const refundOpen = (r?: any) => ['requested', 'review', 'approved', 'processing'].indexOf(r.status) >= 0;
V.page = (c?: any) => {
  const db = c.state.db, nav = c.state.nav, now = Date.now(), M = MBA, money = M.money, cu = (id?: any) => M.cust(db, id);
  const out: any = { tabs: [], hasTabs: false, chips: [], hasChips: false, table: null, kpis: [], hasKpis: false, minis: [], hasMinis: false, settings: null, isSettings: false, tools: [], hasTools: false };
  const setT = (t?: any) => { out.tabs = t.list; out.hasTabs = true; return t.cur; };
  const setC = (ch?: any) => { out.chips = ch.list; out.hasChips = true; return ch.cur; };
  if (nav === 'overview') {
    const live = db.orders.filter((o?: any) => !M.nextInfo(o).done);
    const mb = live.filter((o?: any) => M.nextInfo(o).mb), over = mb.filter((o?: any) => now - o.sAt > 24 * M.H);
    const liveA = db.auctions.filter((a?: any) => auSt(a, now) === 'Live');
    const gmv = db.orders.filter((o?: any) => M.nextInfo(o).done && !o.rejected).reduce((s?: any, o?: any) => s + (o.total || 0), 0);
    out.kpis = [
      ['NEEDS MINERAL BRIDGE', mb.length, over.length + ' over 24 h', over.length ? 'err' : 'ok', () => c.go('buy', { chip: { buy: 'Needs Mineral Bridge', sell: 'Needs Mineral Bridge' } })],
      ['WAITING ON CUSTOMERS', live.length - mb.length, 'Quotes, contracts, payments', 'mute', () => c.go('buy', { chip: { buy: 'Waiting on customer' } })],
      ['PAYMENTS TO CONFIRM', db.orders.filter((o?: any) => !o.hold && o.kind === 'buy' && M.BUY[o.stage] && M.BUY[o.stage].key === 'payOk').length, 'Finance', 'info', () => c.go('payments')],
      ['PAYOUTS TO RELEASE', money(db.orders.filter((o?: any) => o.kind === 'sell' && M.SELL[o.stage] && M.SELL[o.stage].key === 'payout').reduce((s?: any, o?: any) => s + o.total, 0)), 'Sell requests at payment', 'gold', () => c.go('payments', { tab: { payments: 'Payouts' } })],
      ['LIVE AUCTIONS', liveA.length, liveA.reduce((s?: any, a?: any) => s + bidCount(a), 0) + ' bids', 'info', () => c.go('auctions', { chip: { auctions: 'Live' } })],
      ['KYC TO REVIEW', db.kyc.filter((k?: any) => k.status === 'pending').length, db.kyc.filter((k?: any) => k.status === 'requested').length + ' awaiting re-upload', 'warn', () => c.go('customers', { tab: { customers: 'KYC queue' } })],
      ['OPEN REFUNDS', db.refunds.filter(refundOpen).length, money(db.refunds.filter(refundOpen).reduce((s?: any, r?: any) => s + r.amount, 0)), 'warn', () => c.go('refunds')],
      ['COMPLETED VALUE', money(gmv), db.orders.filter((o?: any) => M.nextInfo(o).done && !o.rejected).length + ' orders and requests', 'ok', () => c.go('buy', { chip: { buy: 'Completed' } })]
    ].map((k, i) => ({ label: k[0], value: String(k[1]), sub: k[2], go: k[4], subStyle: 'font-size:11.5px; font-weight:700; color:var(--' + k[3] + 'Ink);', style: 'display:flex; flex-direction:column; gap:8px; padding:16px 18px; border-radius:18px; border:1px solid var(--line); background:var(--card); box-shadow:var(--shadow); cursor:pointer; text-align:left; animation:mbUp .35s ' + (i * 0.04).toFixed(2) + 's backwards ease; transition:transform .15s ease, border-color .15s ease;' }));
    out.hasKpis = true;
    const q = mb.filter((o?: any) => V.match(c, [o.id, cu(o.cust).name, cu(o.cust).business, M.nextInfo(o).label])).sort((a?: any, b?: any) => a.sAt - b.sAt);
    out.table = V.table(c, 'queue', [['RECORD', '1.25fr', (o?: any) => o.id], ['CUSTOMER', '1.3fr'], ['WAITING FOR', '1.5fr'], ['ROLE', '1.1fr'], ['IN STEP', '.8fr', (o?: any) => o.sAt], ['VALUE', '.9fr', (o?: any) => o.total || 0, 1]], q, (o?: any) => { const n = M.nextInfo(o), age = now - o.sAt, ov = age > 24 * M.H; return { hl: ov, cells: [{ t: o.id, s: o.kind === 'sell' ? 'Sell request' : 'Buy order', id: 1 }, { t: M.cname(cu(o.cust)), s: cu(o.cust).country }, { t: n.label, pill: n.tone }, { t: n.role ? V.roleLabel(n.role) : '—' }, { t: M.ago(age), tone: ov ? 'err' : null, b: ov }, { t: o.total ? money(o.total) : '—', r: 1, b: 1 }], go: () => c.openOrder(o.id) }; }, { title: 'Needs Mineral Bridge · oldest first', empty: 'Nothing is waiting on Mineral Bridge.' });
    const wc = live.filter((o?: any) => !M.nextInfo(o).mb).sort((a?: any, b?: any) => a.sAt - b.sAt).slice(0, 6);
    const closing = db.auctions.filter((a?: any) => auSt(a, now) === 'Live').sort((a?: any, b?: any) => a.closes - b.closes);
    out.minis = [
      { title: 'Waiting on customers', items: wc.map((o?: any) => ({ t: o.id, s: M.nextInfo(o).label + ' · ' + M.ago(now - o.sAt), btn: 'Remind', go: () => c.openOrder(o.id), act: () => { V.tell(c, o.cust, 'Reminder: ' + M.nextInfo(o).label, o.id); V.log(c, 'Order', o.id, 'Reminder sent'); c.commit('Reminder sent to ' + cu(o.cust).name); } })) },
      { title: 'Live auctions', items: closing.map((a?: any) => { const lot = lotBits(db, a), tb = top(a); return { t: a.id + ' · ' + lot.name, s: (tb ? money(tb.amt) + ' · ' + bidCount(a) + ' bids' : 'No bids') + ' · closes in ' + M.left(a.closes - now), btn: 'Open', go: () => c.openDrawer('auction', a.id), act: () => c.openDrawer('auction', a.id) }; }) }
    ];
    out.hasMinis = true;
    return out;
  }
  if (nav === 'buy' || nav === 'sell' || nav === 'inspections') {
    const kind = nav === 'buy' ? 'buy' : 'sell';
    let list = db.orders.filter((o?: any) => o.kind === kind);
    if (nav === 'inspections') {
      list = list.filter((o?: any) => o.stage >= 9 && o.stage <= 13);
      const ch = setC(V.chips(c, 'insp', ['All', 'To schedule', 'Scheduled', 'Awaiting report', 'Seller review'], [list.length].concat(['schedule', 'inspect', 'sgs', 'reportOk'].map(k => list.filter((o?: any) => M.SELL[o.stage].key === k).length))));
      const key = ({ 'To schedule': 'schedule', Scheduled: 'inspect', 'Awaiting report': 'sgs', 'Seller review': 'reportOk' } as any)[ch];
      list = list.filter((o?: any) => (!key || M.SELL[o.stage].key === key) && V.match(c, [o.id, cu(o.cust).name, o.sell.name, o.insp && o.insp.inspector]));
      out.table = V.table(c, 'insp', [['REQUEST', '1.25fr', (o?: any) => o.id], ['SELLER', '1.3fr'], ['MATERIAL', '1.4fr'], ['AGENCY', '1.2fr'], ['SLOT', '1fr'], ['STEP', '1.4fr', (o?: any) => o.stage], ['REPORT', '1fr']], list, (o?: any) => { const n = M.nextInfo(o), today = o.insp && o.insp.date === M.day(now); return { hl: today, cells: [{ t: o.id, id: 1 }, { t: M.cname(cu(o.cust)), s: cu(o.cust).country }, { t: V.itemsText(db, o), s: o.sell.grade }, { t: o.insp ? (o.insp.agency || '—') : 'Not booked', s: o.insp ? o.insp.inspector : '', tone: o.insp ? null : 'warn' }, { t: o.insp ? o.insp.date : o.form ? o.form.slot.date : '—', s: o.insp ? o.insp.time + (today ? ' · today' : '') : 'Seller preference', tone: today ? 'warn' : null }, { t: n.label, pill: n.tone }, { t: o.sgs ? o.sgs.no : '—', s: o.sgs ? o.sgs.grade : '' }], go: () => c.openOrder(o.id) }; });
      return out;
    }
    const labels = ['All', 'Needs Mineral Bridge', 'Waiting on customer', 'On hold', 'Completed', 'Rejected'];
    const ch = setC(V.chips(c, nav, labels, labels.map(l => list.filter((o?: any) => V.orderChip(o, l)).length)));
    list = list.filter((o?: any) => V.orderChip(o, ch) && V.match(c, [o.id, cu(o.cust).name, cu(o.cust).business, V.itemsText(db, o), M.nextInfo(o).label, o.src]));
    out.table = V.table(c, nav, V.orderCols(kind), list.sort((a?: any, b?: any) => b.at - a.at), (o?: any) => V.orderRow(c, o));
    return out;
  }
  if (nav === 'auctions') {
    const labels = ['All', 'Live', 'Upcoming', 'Paused', 'Closed', 'Cancelled'];
    const ch = setC(V.chips(c, 'auctions', labels, labels.map(l => l === 'All' ? db.auctions.length : db.auctions.filter((a?: any) => auSt(a, now) === l).length)));
    const list = db.auctions.filter((a?: any) => (ch === 'All' || auSt(a, now) === ch) && V.match(c, [a.id, a.lot, lotBits(db, a).name]));
    out.tools = [V.act(c, 'New auction', () => c.openDrawer('newAuction', 'new'), 1, 'auction')]; out.hasTools = true;
    out.table = V.table(c, 'auctions', [['AUCTION', '.8fr', (a?: any) => a.id], ['LOT', '1.6fr'], ['QUANTITY', '.8fr'], ['TOP BID', '1fr', (a?: any) => top(a) ? top(a).amt : 0], ['BIDS', '.6fr', (a?: any) => bidCount(a)], ['STATUS', '.9fr'], ['CLOSES', '1fr', (a?: any) => a.closes], ['WINNER', '1.2fr']], list.sort((a?: any, b?: any) => b.closes - a.closes), (a?: any) => { const lot = lotBits(db, a), s = auSt(a, now), tb = top(a), w = a.winner ? cu(a.winner) : null; return { cells: [{ t: a.id, id: 1 }, { t: lot.name, s: (lot.l ? lot.l.id : (a.lot || '')) + (lot.grade ? ' · ' + lot.grade : '') }, { t: M.qfmt(a.qty, lot.unit) }, { t: tb ? money(tb.amt) : 'No bids', s: 'Start ' + money(a.start), b: !!tb }, { t: bidCount(a) }, { t: s, pill: s === 'Live' ? 'ok' : s === 'Upcoming' ? 'info' : s === 'Paused' ? 'warn' : s === 'Cancelled' ? 'err' : 'mute' }, { t: s === 'Live' || s === 'Paused' ? M.left(a.closes - now) : M.fmt(a.closes), s: s === 'Upcoming' ? 'Opens ' + M.fmt(a.opens) : '' }, { t: w ? M.cname(w) : s === 'Closed' && !tb ? 'Unsold' : '—', s: a.orderId || '' }], go: () => c.openDrawer('auction', a.id) }; });
    return out;
  }
  if (nav === 'customers') {
    const t = setT(V.tabs(c, 'customers', ['Customers', 'KYC queue']));
    if (t === 'KYC queue') {
      const labels = ['pending', 'requested', 'rejected', 'approved'];
      const ch = setC(V.chips(c, 'kyc', ['All'].concat(labels), [db.kyc.length].concat(labels.map(l => db.kyc.filter((k?: any) => k.status === l).length))));
      const list = db.kyc.filter((k?: any) => (ch === 'All' || k.status === ch) && V.match(c, [k.ref, cu(k.cust).name, k.idType]));
      out.table = V.table(c, 'kyc', [['REFERENCE', '1.2fr', (k?: any) => k.ref], ['CUSTOMER', '1.5fr'], ['ID TYPE', '1fr'], ['DOCUMENTS', '1.1fr'], ['SUBMITTED', '1fr', (k?: any) => k.at], ['STATUS', '.9fr', (k?: any) => k.status]], list.sort((a?: any, b?: any) => b.at - a.at), (k?: any) => ({ hl: k.status === 'pending' && now - k.at > 24 * M.H, cells: [{ t: k.ref, id: 1 }, { t: cu(k.cust).name, s: cu(k.cust).business || 'Individual' }, { t: k.idType }, { t: k.docs.length + ' files', s: k.biz ? 'Includes business docs' : 'Individual' }, { t: M.ago(now - k.at) + ' ago' }, { t: k.status, pill: k.status === 'approved' ? 'ok' : k.status === 'rejected' ? 'err' : k.status === 'requested' ? 'warn' : 'info' }], go: () => c.openDrawer('kyc', k.ref) }));
      return out;
    }
    const ch = setC(V.chips(c, 'cust', ['All', 'Buyers', 'Sellers', 'Both', 'Suspended']));
    const list = db.customers.filter((x?: any) => (ch === 'All' || (ch === 'Suspended' ? x.status === 'suspended' : x.role === ({ Buyers: 'buyer', Sellers: 'seller', Both: 'both' } as any)[ch])) && V.match(c, [x.id, x.name, x.business, x.email, x.whatsapp, x.country]));
    out.table = V.table(c, 'cust', [['CUSTOMER', '1.5fr', (x?: any) => x.name], ['TYPE', '1.6fr'], ['COUNTRY', '.9fr', (x?: any) => x.country], ['SIGNS IN WITH', '1.2fr'], ['KYC', '.8fr', (x?: any) => x.kyc], ['STATUS', '.8fr', (x?: any) => x.status], ['JOINED', '.8fr', (x?: any) => x.joined]], list, (x?: any) => ({ cells: [{ t: x.name, s: x.business || 'Individual', b: 1 }, { t: x.role === 'both' ? 'Buyer & seller' : x.role === 'buyer' ? 'Buyer' : 'Seller', s: [M.BT[x.buyerType], M.ST[x.sellerType]].filter(Boolean).join(' · ') }, { t: x.country }, { t: x.signin === 'email' ? x.email : x.whatsapp, s: x.signin === 'email' ? 'Email' : 'WhatsApp' }, { t: x.kyc, pill: x.kyc === 'approved' ? 'ok' : x.kyc === 'rejected' ? 'err' : 'warn' }, { t: x.status, pill: x.status === 'active' ? 'ok' : 'err' }, { t: M.date(x.joined) }], go: () => c.openDrawer('customer', x.id) }));
    return out;
  }
  if (nav === 'catalogue') {
    const ct = setT(V.tabs(c, 'catalogue', ['Lots', 'Categories']));
    if (ct === 'Categories') { out.tools = [V.act(c, 'New category', () => c.openDrawer('newCat', 'new'), 1, 'catalogue')]; out.hasTools = true; out.table = V.catTable(c); return out; }
    const labels = ['listed', 'draft', 'sold out', 'archived'];
    const ch = setC(V.chips(c, 'lots', ['All'].concat(labels), [db.lots.length].concat(labels.map(l => db.lots.filter((x?: any) => x.status === l).length))));
    const list = db.lots.filter((x?: any) => (ch === 'All' || x.status === ch) && V.match(c, [x.id, x.name, x.mineral, x.origin, x.lab, x.cert]));
    out.tools = [V.act(c, 'New lot', () => c.openDrawer('newLot', 'new'), 1, 'catalogue')]; out.hasTools = true;
    out.table = V.table(c, 'lots', [['LOT', '.8fr', (x?: any) => x.id], ['MATERIAL', '1.7fr', (x?: any) => x.name], ['GRADE', '1fr'], ['AVAILABLE', '.9fr', (x?: any) => x.avail], ['MINIMUM', '.7fr'], ['TEST REPORT', '1.5fr'], ['STATUS', '.8fr', (x?: any) => x.status]], list, (x?: any) => ({ cells: [{ t: x.id, id: 1 }, { t: x.name, s: (V.subOf ? ((V.subOf(db, x.mineral) || {}).sub || {}).label || x.mineral : x.form) + ' · ' + x.form + ' · ' + x.origin }, { t: x.grade || 'Not tested', tone: x.grade ? null : 'warn' }, { t: M.qfmt(x.avail, x.unit), tone: x.avail === 0 ? 'err' : null }, { t: M.qfmt(x.min, x.unit) }, { t: x.cert || 'None — cannot be quoted', s: x.lab, tone: x.cert ? null : 'warn' }, { t: x.status, pill: x.status === 'listed' ? 'ok' : x.status === 'draft' ? 'info' : x.status === 'sold out' ? 'warn' : 'mute' }], go: () => c.openDrawer('lot', x.id) }));
    return out;
  }
  if (nav === 'payments') {
    const t = setT(V.tabs(c, 'payments', ['Incoming', 'Payouts']));
    if (t === 'Payouts') {
      const list = db.orders.filter((o?: any) => o.payout && V.match(c, [o.id, cu(o.cust).name, o.payout.account]));
      out.table = V.table(c, 'po', [['REQUEST', '1.2fr', (o?: any) => o.id], ['SELLER', '1.4fr'], ['AMOUNT', '1fr', (o?: any) => o.payout.amount], ['TO', '1.6fr'], ['APPROVALS', '1.1fr'], ['STATUS', '.9fr'], ['REFERENCE', '1.1fr']], list, (o?: any) => { const done = !!o.payout.ref, need = o.payout.amount > db.settings.payoutApprover; return { hl: !done && M.SELL[o.stage] && M.SELL[o.stage].key === 'payout', cells: [{ t: o.id, id: 1 }, { t: M.cname(cu(o.cust)), s: cu(o.cust).country }, { t: money(o.payout.amount), b: 1 }, { t: o.payout.account, s: o.payout.method }, { t: need ? o.payout.approvals.length + ' of 2' : 'Single approver', s: o.payout.approvals.join(', '), tone: need && o.payout.approvals.length < 2 && !done ? 'warn' : null }, { t: done ? 'Released' : 'To release', pill: done ? 'ok' : 'gold' }, { t: o.payout.ref || '—', s: done ? M.fmt(o.payout.at) : '' }], go: () => c.openOrder(o.id) }; });
      return out;
    }
    const methods = ['All', 'Bank transfer', 'UPI', 'Net banking', 'Bitcoin'];
    const ch = setC(V.chips(c, 'pay', methods));
    const list = db.orders.filter((o?: any) => o.pay && (ch === 'All' || o.pay.method === ch) && V.match(c, [o.id, cu(o.cust).name, o.pay.ref, o.pay.method]));
    out.table = V.table(c, 'pay', [['ORDER', '1.2fr', (o?: any) => o.id], ['BUYER', '1.4fr'], ['METHOD', '1fr', (o?: any) => o.pay.method], ['AMOUNT', '1fr', (o?: any) => o.pay.amount], ['DETAIL', '1.6fr'], ['STATUS', '.9fr', (o?: any) => o.pay.status], ['PAID', '.9fr', (o?: any) => o.pay.at]], list.sort((a?: any, b?: any) => b.pay.at - a.pay.at), (o?: any) => { const p = o.pay; return { hl: p.status === 'pending', cells: [{ t: o.id, id: 1 }, { t: M.cname(cu(o.cust)) }, { t: p.method }, { t: money(p.amount), b: 1, s: o.refunded ? 'Refunded ' + money(o.refunded) : '' }, { t: p.btc ? p.btc.conf + ' of ' + db.settings.btcConfs + ' confirmations' : p.proof || p.upi || p.bank || p.manual || '—', s: p.ref || p.gateway || '', mono: !!p.btc }, { t: p.status, pill: p.status === 'confirmed' ? 'ok' : 'warn' }, { t: M.fmt(p.at) }], go: () => c.openOrder(o.id) }; });
    return out;
  }
  if (nav === 'refunds') {
    const labels = ['requested', 'review', 'approved', 'processing', 'refunded', 'declined'];
    const ch = setC(V.chips(c, 'rf', ['All'].concat(labels), [db.refunds.length].concat(labels.map(l => db.refunds.filter((r?: any) => r.status === l).length))));
    const list = db.refunds.filter((r?: any) => (ch === 'All' || r.status === ch) && V.match(c, [r.ref, r.order, cu(r.cust).name, r.reason]));
    out.table = V.table(c, 'rf', [['REFUND', '1.1fr', (r?: any) => r.ref], ['ORDER', '1.2fr'], ['CUSTOMER', '1.3fr'], ['TYPE', '.7fr'], ['AMOUNT', '.9fr', (r?: any) => r.amount], ['REASON', '1.5fr'], ['STATUS', '.9fr', (r?: any) => r.status], ['REQUESTED', '.9fr', (r?: any) => r.at]], list.sort((a?: any, b?: any) => b.at - a.at), (r?: any) => ({ hl: refundOpen(r) && now - r.at > db.settings.refundSla * M.D, cells: [{ t: r.ref, id: 1 }, { t: r.order }, { t: M.cname(cu(r.cust)) }, { t: r.type }, { t: money(r.amount), b: 1, s: r.amount > db.settings.refundApprover ? 'Needs 2 approvers' : '' }, { t: r.reason }, { t: r.status, pill: r.status === 'refunded' ? 'ok' : r.status === 'declined' ? 'err' : r.status === 'approved' || r.status === 'processing' ? 'info' : 'warn' }, { t: M.ago(now - r.at) + ' ago' }], go: () => c.openDrawer('refund', r.ref) }));
    return out;
  }
  if (nav === 'documents') {
    const t = setT(V.tabs(c, 'documents', ['Register', 'Templates']));
    if (t === 'Templates') { out.table = V.table(c, 'tpl', [['TEMPLATE', '2fr', (x?: any) => x.name], ['VERSION', '.6fr', (x?: any) => x.ver], ['UPDATED', '1fr', (x?: any) => x.updated]], db.dtpl.filter((x?: any) => V.match(c, [x.name])), (x?: any) => ({ cells: [{ t: x.name, b: 1 }, { t: 'v' + x.ver }, { t: M.date(x.updated) }], go: () => c.openDrawer('tpl', x.id) })); return out; }
    const labels = ['issued', 'processing', 'replaced', 'cancelled'];
    const ch = setC(V.chips(c, 'docs', ['All'].concat(labels), [db.docs.length].concat(labels.map(l => db.docs.filter((d?: any) => d.status === l).length))));
    const list = db.docs.filter((d?: any) => (ch === 'All' || d.status === ch) && V.match(c, [d.no, d.type, d.eid]));
    out.table = V.table(c, 'docs', [['NUMBER', '1.2fr', (d?: any) => d.no], ['TYPE', '1.6fr', (d?: any) => d.type], ['LINKED RECORD', '1.3fr', (d?: any) => d.eid], ['VERSION', '.6fr'], ['STATUS', '.9fr', (d?: any) => d.status], ['ISSUED', '1fr', (d?: any) => d.at], ['BY', '1fr']], list.sort((a?: any, b?: any) => b.at - a.at), (d?: any) => ({ cells: [{ t: d.no, id: 1, mono: 1 }, { t: d.type }, { t: d.eid }, { t: 'v' + d.ver }, { t: d.status, pill: d.status === 'issued' ? 'ok' : d.status === 'cancelled' ? 'err' : d.status === 'processing' ? 'warn' : 'mute' }, { t: M.fmt(d.at) }, { t: d.by }], go: () => c.openDrawer('doc', d.no) }));
    return out;
  }
  if (nav === 'logistics') {
    const t = setT(V.tabs(c, 'logistics', ['Shipments', 'Partners']));
    if (t === 'Partners') { const list = db.partners.filter((p?: any) => V.match(c, [p.name, p.type, p.regions])); out.table = V.table(c, 'pt', [['PARTNER', '1.5fr', (p?: any) => p.name], ['TYPE', '.9fr', (p?: any) => p.type], ['MODES', '.9fr'], ['REGIONS', '1.5fr'], ['CONTACT', '1.6fr'], ['STATUS', '.7fr']], list, (p?: any) => ({ cells: [{ t: p.name, b: 1 }, { t: ({ logistics: 'Logistics', inspection: 'Inspection agency', inspector: 'Agency inspector' } as any)[p.type] }, { t: p.modes }, { t: p.regions }, { t: p.contact }, { t: p.active ? 'Active' : 'Paused', pill: p.active ? 'ok' : 'mute' }], go: () => c.openDrawer('partner', p.id) })); return out; }
    const ch = setC(V.chips(c, 'ship', ['All', 'Buy deliveries', 'Sell collections', 'In transit']));
    const list = db.orders.filter((o?: any) => o.ship && (ch === 'All' || (ch === 'Buy deliveries' && o.kind === 'buy') || (ch === 'Sell collections' && o.kind === 'sell') || (ch === 'In transit' && o.ship.status === 'In transit')) && V.match(c, [o.ship.id, o.id, o.ship.partner, cu(o.cust).name]));
    out.table = V.table(c, 'ship', [['SHIPMENT', '1fr', (o?: any) => o.ship.id], ['ORDER', '1.2fr', (o?: any) => o.id], ['PARTNER', '1.3fr'], ['MODE', '.8fr'], ['ROUTE', '2fr'], ['STATUS', '1fr'], ['LAST EVENT', '1fr', (o?: any) => o.ship.events.length ? o.ship.events[o.ship.events.length - 1].at : 0]], list, (o?: any) => { const e = o.ship.events[o.ship.events.length - 1]; return { cells: [{ t: o.ship.id, id: 1, mono: 1 }, { t: o.id, s: o.kind === 'sell' ? 'Collection' : 'Delivery' }, { t: o.ship.partner }, { t: o.ship.mode, s: o.ship.scope }, { t: o.ship.from.split(',')[0] + ' → ' + o.ship.to.split(',')[0] }, { t: o.ship.status, pill: /Delivered|Received/.test(o.ship.status) ? 'ok' : o.ship.status === 'In transit' ? 'info' : 'mute' }, { t: e ? M.fmt(e.at) : '—', s: e ? e.loc : '' }], go: () => c.openOrder(o.id) }; });
    return out;
  }
  if (nav === 'support') {
    const ch = setC(V.chips(c, 'th', ['All', 'Unread', 'Open', 'Resolved']));
    const list = db.threads.filter((t?: any) => (ch === 'All' || (ch === 'Unread' ? t.unread > 0 : t.status === ch.toLowerCase())) && V.match(c, [t.id, cu(t.cust).name, t.ref, t.tag, t.msgs[t.msgs.length - 1].text]));
    out.table = V.table(c, 'th', [['THREAD', '.6fr', (t?: any) => t.id], ['CUSTOMER', '1.2fr'], ['TOPIC', '1fr', (t?: any) => t.tag], ['LAST MESSAGE', '2.4fr'], ['ASSIGNEE', '1fr', (t?: any) => t.assignee], ['STATUS', '.8fr'], ['UPDATED', '.8fr', (t?: any) => t.msgs[t.msgs.length - 1].at]], list.sort((a?: any, b?: any) => b.msgs[b.msgs.length - 1].at - a.msgs[a.msgs.length - 1].at), (t?: any) => { const m = t.msgs[t.msgs.length - 1]; return { hl: t.unread > 0, cells: [{ t: t.id, id: 1 }, { t: cu(t.cust).name, s: cu(t.cust).business || 'Individual' }, { t: t.tag, s: t.ref || '' }, { t: m.text, s: (m.from === 'cust' ? 'Customer' : m.who) }, { t: t.assignee }, { t: t.unread ? t.unread + ' unread' : t.status, pill: t.unread ? 'info' : t.status === 'resolved' ? 'ok' : 'mute' }, { t: M.ago(now - m.at) + ' ago' }], go: () => c.openDrawer('thread', t.id) }; });
    return out;
  }
  if (nav === 'notifications') {
    const ch = setC(V.chips(c, 'nt', ['All', 'email', 'sms', 'whatsapp', 'push', 'failed']));
    const list = db.deliveries.filter((d?: any) => (ch === 'All' || (ch === 'failed' ? d.status === 'failed' : d.channel === ch)) && V.match(c, [cu(d.cust).name, d.event, d.ref, d.channel]));
    out.table = V.table(c, 'nt', [['SENT', '1fr', (d?: any) => d.at], ['CUSTOMER', '1.3fr'], ['EVENT', '1.6fr'], ['RECORD', '1.2fr'], ['CHANNEL', '.8fr', (d?: any) => d.channel], ['STATUS', '.8fr', (d?: any) => d.status]], list, (d?: any) => ({ hl: d.status === 'failed', cells: [{ t: M.fmt(d.at) }, { t: cu(d.cust).name }, { t: d.event }, { t: d.ref || '—' }, { t: d.channel }, { t: d.status, pill: d.status === 'failed' ? 'err' : d.status === 'delivered' ? 'ok' : 'info' }], go: () => c.openDrawer('notif', db.deliveries.indexOf(d)) }), { cap: 80 });
    return out;
  }
  if (nav === 'audit') {
    const ents = ['All', 'Order', 'Sell request', 'KYC', 'Refund', 'Auction', 'Payout', 'Lot', 'Setting', 'Admin'];
    const ch = setC(V.chips(c, 'au', ents));
    const list = db.audit.filter((e?: any) => (ch === 'All' || e.entity === ch) && V.match(c, [e.actor, e.role, e.eid, e.action, e.note]));
    out.table = V.table(c, 'au', [['TIME', '1fr', (e?: any) => e.at], ['ACTOR', '1.3fr', (e?: any) => e.actor], ['RECORD', '1.2fr', (e?: any) => e.eid], ['ACTION', '1.5fr', (e?: any) => e.action], ['CHANGE', '1.3fr'], ['NOTE', '1.4fr']], list, (e?: any) => ({ cells: [{ t: M.fmt(e.at), mono: 1 }, { t: e.actor, s: e.role }, { t: e.eid || '—', s: e.entity, id: 1 }, { t: e.action }, { t: e.before || e.after ? (e.before || '—') + ' → ' + (e.after || '—') : '—' }, { t: e.note || '—', s: e.ip }], go: () => { const o = db.orders.find((x?: any) => x.id === e.eid); if (o) c.openOrder(o.id); } }), { cap: 100 });
    return out;
  }
  if (nav === 'settings') {
    const t = setT(V.tabs(c, 'settings', ['Configuration', 'Roles & permissions', 'Admin users']));
    if (t === 'Roles & permissions') { const rv = V.rolesView(c); out.chips = rv.chips; out.hasChips = true; out.table = rv.table; return out; }
    if (t === 'Admin users') { out.tools = [V.act(c, 'Invite admin', () => c.openDrawer('newAdmin', 'new'), 1, 'settings')]; out.hasTools = true; out.table = V.table(c, 'ad', [['NAME', '1.4fr', (a?: any) => a.name], ['ROLE', '1.3fr', (a?: any) => a.role], ['EMAIL', '1.8fr'], ['2FA', '.7fr'], ['STATUS', '.8fr']], db.admins.filter((a?: any) => V.match(c, [a.name, a.email, V.roleLabel(a.role)])), (a?: any) => ({ cells: [{ t: a.name, b: 1 }, { t: V.roleLabel(a.role) }, { t: a.email }, { t: a.tfa ? 'On' : 'Reset pending', pill: a.tfa ? 'ok' : 'warn' }, { t: a.status, pill: a.status === 'active' ? 'ok' : 'mute' }], go: () => c.openDrawer('admin', a.id) })); return out; }
    out.isSettings = true; out.settings = V.settingsView(c);
    return out;
  }
  return out;
};
const GROUPS: any[] = [['Sign-in', [['codeDigits', 'Code length (digits)'], ['codeResend', 'Resend after (seconds)'], ['codeExpiry', 'Code expiry (minutes)']]], ['Quotations', [['buyValidity', 'Buy quote validity (days)'], ['sellValidity', 'Sell quote validity (hours)']]], ['Auctions', [['bidStep', 'Default bid step ($)'], ['auctionWindow', 'Winner payment window (hours)']]], ['Approvals', [['payoutApprover', 'Second approver for payouts above ($)'], ['refundApprover', 'Second approver for refunds above ($)'], ['payoutHours', 'Payout target (hours)'], ['refundSla', 'Refund review SLA (days)']]], ['Bitcoin', [['btcConfs', 'Confirmations required'], ['btcLock', 'Rate lock (minutes)'], ['btcCountries', 'Allowed countries']]], ['Sell requests', [['minPhotos', 'Minimum photos'], ['tolerance', 'Vault weight tolerance (%)']]], ['Receiving bank', [['bankName', 'Account name'], ['bankBank', 'Bank'], ['bankAcct', 'Account number'], ['bankSwift', 'SWIFT'], ['bankUpi', 'UPI ID']]]];
V.settingsView = (c?: any) => {
  const S = c.state.db.settings, can = V.can(c, 'settings');
  return {
    groups: GROUPS.map(g => ({ title: g[0], items: g[1].map((f?: any) => Object.assign(V.inp(c, 'set_' + f[0], f[1], S[f[0]]), { ro: !can })) })),
    methods: [['mBank', 'Bank transfer'], ['mUPI', 'UPI'], ['mNet', 'Net banking'], ['mBTC', 'Bitcoin']].map((m: any) => ({ label: m[1], on: S[m[0]] ? 'On' : 'Off', style: V.chip(!!S[m[0]]), go: () => { if (!can) return c.toast('Needs Super admin'); S[m[0]] = !S[m[0]]; V.log(c, 'Setting', m[0], m[1] + (S[m[0]] ? ' enabled' : ' disabled'), !S[m[0]], S[m[0]]); if (c.state.db.live && V.persistSettings) V.persistSettings(c, { [m[0]]: !!S[m[0]] }); c.commit(m[1] + (S[m[0]] ? ' enabled' : ' disabled')); } })),
    save: V.act(c, 'Save configuration', () => { let n = 0; const changed: Record<string, unknown> = {}; Object.keys(c.form).forEach(k => { if (k.indexOf('set_') !== 0) return; const key = k.slice(4), nv = c.form[k], ov = S[key]; const cast = typeof ov === 'number' ? +nv : nv; if (cast !== ov && !(typeof ov === 'number' && isNaN(cast))) { S[key] = cast; changed[key] = cast; V.log(c, 'Setting', key, 'Setting changed', ov, cast); n++; } }); c.form = {}; if (n && c.state.db.live && V.persistSettings) V.persistSettings(c, changed); c.commit(n ? n + ' setting' + (n > 1 ? 's' : '') + ' saved' : 'No changes to save'); }, 1, 'settings'),
    reset: { label: c.state.db.live ? 'Reload records' : 'Reset demo data', style: V.B[3], go: () => { if (c.state.db.live) { void getConsoleDb().then((db) => { c.setState({ db, drawer: null }); c.toast('Reloaded from the database'); }).catch(() => c.toast('Could not reload records')); return; } c.setState({ db: MBA.build(Date.now()), drawer: null, orderId: null }); c.toast('Demo data reset'); } },
    note: can ? 'Payment methods and the receiving-bank details are read by the customer app. Quote validity, auction rules, approval thresholds and Bitcoin settings are stored for this console; the customer app does not apply every one of those yet.' : 'Read only — only a Super admin can change configuration.'
  };
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-drawers.js. Behaviour and styles are kept as designed.
import { MBA, MBV } from './registry';

const V = MBV;
const D: any = {};
const now = () => Date.now();
const kv = (k?: any, v?: any) => ({ k, v: v == null || v === '' ? '—' : String(v) });
D.customer = (c?: any, id?: any) => {
  const db = c.state.db, x = MBA.cust(db, id), M = MBA;
  const orders = db.orders.filter((o?: any) => o.cust === id);
  const acts = [{ label: 'Open KYC ' + x.kycRef, style: V.B[2], go: () => c.openDrawer('kyc', x.kycRef) }];
  if (x.status === 'active') acts.push(V.act(c, 'Suspend account', () => { const r = V.val(c, 'reason', ''); if (!r) return c.toast('Add a reason — the customer sees it'); x.status = 'suspended'; x.suspendReason = r; V.log(c, 'Customer', x.id, 'Account suspended', 'active', 'suspended', r); V.tell(c, x.id, 'Account suspended', x.id); c.commit(x.name + ' suspended'); if (V.persistSuspend) V.persistSuspend(c, x, r); }, 3, 'suspend'));
  else acts.push(V.act(c, 'Reinstate account', () => { x.status = 'active'; x.suspendReason = ''; V.log(c, 'Customer', x.id, 'Account reinstated', 'suspended', 'active'); V.tell(c, x.id, 'Account reinstated', x.id); c.commit(x.name + ' reinstated'); if (V.persistReinstate) V.persistReinstate(c, x); }, 4, 'suspend'));
  return { title: x.name, sub: (x.business || 'Individual') + ' · ' + x.country, pill: x.status, pillStyle: V.pill(x.status === 'active' ? 'ok' : 'err'),
    fields: [kv('Customer ID', x.id), kv('Role', x.role === 'both' ? 'Buyer and seller' : x.role), kv('Buyer type', M.BT[x.buyerType]), kv('Seller type', M.ST[x.sellerType]), kv('Email', x.email), kv('WhatsApp', x.whatsapp), kv('Signs in with', x.signin === 'email' ? 'Email code' : 'WhatsApp code'), kv('Notifications', ['email', 'sms', 'whatsapp', 'push'].filter(k => x.prefs[k]).join(', ')), kv('KYC', x.kyc + ' · ' + x.kycRef), kv('Joined', M.date(x.joined))].concat(x.suspendReason ? [kv('Suspended because', x.suspendReason)] : []),
    sections: [{ title: 'Orders and sell requests · ' + orders.length, items: orders.map((o?: any) => ({ t: o.id, s: M.nextInfo(o).label, r: o.total ? M.money(o.total) : '', go: () => c.openOrder(o.id) })) }],
    inputs: x.status === 'active' ? [V.inp(c, 'reason', 'Reason for suspension (shown to customer)', '', true)] : [], actions: acts };
};
D.kyc = (c?: any, ref?: any) => {
  const db = c.state.db, k = db.kyc.find((x?: any) => x.ref === ref), cu = MBA.cust(db, k.cust);
  const set = (st?: any, msg?: any, r?: any) => { k.status = st; k.reviewedBy = V.me(c).name; k.reason = r || ''; cu.kyc = st === 'requested' ? 'requested' : st; if (st === 'approved') k.docs.forEach((d?: any) => { d.status = 'ok'; d.note = ''; }); if (st === 'requested') k.docs.forEach((d?: any) => { if (d.kind === 'address' || d.kind === 'business') { d.status = 'requested'; d.note = r; } }); V.log(c, 'KYC', k.ref, 'KYC ' + st, '', st, r); V.tell(c, cu.id, 'KYC ' + st, k.ref); c.form = {}; c.commit(msg); if (k.live && V.persistKyc) V.persistKyc(c, k, st, r); };
  const acts = [];
  if (k.status !== 'approved') acts.push(V.act(c, 'Approve', () => set('approved', cu.name + ' verified'), 4, 'kyc'));
  if (k.status === 'pending') { acts.push(V.act(c, 'Request documents', () => { const r = V.val(c, 'reason', ''); if (!r) return c.toast('Say which document and why'); set('requested', 'Documents requested from ' + cu.name, r); }, 2, 'kyc')); acts.push(V.act(c, 'Reject', () => { const r = V.val(c, 'reason', ''); if (!r) return c.toast('Add a reason — the customer sees it'); set('rejected', 'KYC rejected', r); }, 3, 'kyc')); }
  if (k.status === 'requested') acts.push({ label: 'Simulate customer re-uploads', style: V.B[2], go: () => { k.status = 'pending'; cu.kyc = 'pending'; k.at = now(); k.docs.forEach((d?: any) => { d.status = 'submitted'; d.note = ''; }); c.commit('New documents received'); } });
  return { title: k.ref, sub: cu.name + ' · ' + (cu.business || 'Individual') + ' · ' + cu.country, pill: k.status, pillStyle: V.pill(k.status === 'approved' ? 'ok' : k.status === 'rejected' ? 'err' : 'warn'),
    fields: [kv('ID type', k.idType), kv('Business documents', k.biz ? 'Required (' + (MBA.BT[cu.buyerType] || MBA.ST[cu.sellerType]) + ')' : 'Not required'), kv('Submitted', MBA.fmt(k.at)), kv('Reviewed by', k.reviewedBy), kv('Reason', k.reason)],
    sections: [{ title: 'Documents', items: k.docs.map((d?: any) => ({ t: d.label, s: d.note, r: d.status, pill: true, pillStyle: V.pill(d.status === 'ok' ? 'ok' : d.status === 'requested' ? 'warn' : 'info') })) }],
    inputs: k.status === 'pending' ? [V.inp(c, 'reason', 'Reason (for request or reject)', '', true)] : [], actions: acts };
};
function orderFromAuction(c?: any, a?: any) {
  const db = c.state.db, t = V.top(a), l = MBA.lot(db, a.lot);
  if (!l) { c.toast('This auction is not linked to a catalogue lot'); return null; }
  if (!t) { c.toast('No winning bid on this auction'); return null; }
  const cu = MBA.cust(db, t.cust), at = now();
  const id = 'MB-ORD-26-' + (10500 + db.orders.length);
  const o = { id, kind: 'buy', src: a.id, cust: t.cust, items: [{ lot: a.lot, qty: a.qty, entered: MBA.qfmt(a.qty, l.unit) }], stage: 7, at, sAt: at, hold: null, rejected: '', quotes: [{ no: 'Auction ' + a.id, rev: 1, lines: [{ name: l.name, qty: a.qty, unit: l.unit, price: t.amt }], prod: t.amt, fee: 0, transport: 0, total: t.amt, valid: at + db.settings.auctionWindow * MBA.H, at, status: 'accepted' }], hist: ['Won at auction ' + a.id, 'Order accepted', 'Price confirmed at winning bid', 'Auction terms accepted', 'Price confirmed', 'Auction terms accepted as the e-contract', 'E-contract countersigned'].map(x => ({ at, who: 'System', role: 'Auction', text: x, note: '' })), refunded: 0, total: t.amt, addr: MBA.cname(cu) + ', ' + cu.country, contract: { cust: { name: cu.name, at, device: 'Auction terms accepted at bidding' }, mb: { name: 'Auction terms', at } } };
  db.orders.unshift(o); a.orderId = id; a.winner = t.cust;
  l.avail = Math.max(0, +(l.avail - a.qty).toFixed(3));
  MBA.issueDoc(db, 'Auction result certificate', 'AR-' + a.id, 'auction', a.id, at, 'issued', V.me(c).name);
  MBA.issueDoc(db, 'Auction sale contract', 'EC-' + id.slice(-5), 'order', id, at, 'issued', V.me(c).name);
  V.tell(c, t.cust, 'You won auction ' + a.id + ' — pay within ' + db.settings.auctionWindow + ' h', id);
  return o;
}
D.auction = (c?: any, id?: any) => {
  const db = c.state.db, a = db.auctions.find((x?: any) => x.id === id), l = MBA.lot(db, a.lot), st = V.auSt(a, now()), t = V.top(a), M = MBA;
  const acts = [], log = (x?: any, n?: any) => V.log(c, 'Auction', a.id, x, '', '', n);
  if (st === 'Upcoming') { acts.push(V.act(c, 'Open now', () => { if (a.live && V.persistAuctionTransition) { V.persistAuctionTransition(c, a, 'live'); return; } a.opens = now(); log('Opened early'); c.commit(a.id + ' is live'); }, 1, 'auction')); }
  if (st === 'Live') { acts.push(V.act(c, 'Pause bidding', () => { if (a.live && V.persistAuctionTransition) { V.persistAuctionTransition(c, a, 'paused'); return; } a.paused = true; log('Paused'); c.commit(a.id + ' paused'); }, 2, 'auction')); acts.push(V.act(c, 'Extend 1 hour', () => { if (a.live && V.persistAuctionExtend) { V.persistAuctionExtend(c, a, 1); return; } a.closes += M.H; a.extended++; log('Extended 1 h'); c.commit('Now closes ' + M.fmt(a.closes)); }, 2, 'auction')); if (t) acts.push(V.act(c, 'Close and award', () => { if (a.live && V.persistAuctionClose) { V.persistAuctionClose(c, a); return; } a.closed = true; a.closes = now(); const o = orderFromAuction(c, a); if (!o) return; log('Closed and awarded', o.id); c.commit('Awarded to ' + M.cname(M.cust(db, t.cust)) + ' · ' + o.id); }, 1, 'auction')); }
  if (st === 'Paused') acts.push(V.act(c, 'Resume bidding', () => { if (a.live && V.persistAuctionTransition) { V.persistAuctionTransition(c, a, 'live'); return; } a.paused = false; log('Resumed'); c.commit(a.id + ' resumed'); }, 1, 'auction'));
  if (st === 'Live' || st === 'Upcoming' || st === 'Paused') acts.push(V.act(c, 'Cancel auction', () => { const r = V.val(c, 'reason', ''); if (!r) return c.toast('Add a reason — bidders see it'); if (a.live && V.persistAuctionTransition) { V.persistAuctionTransition(c, a, 'cancelled', r); return; } a.cancelled = r; log('Cancelled', r); c.commit(a.id + ' cancelled'); }, 3, 'auction'));
  if (st === 'Closed' && t && !a.orderId) acts.push(V.act(c, 'Create winner order', () => { if (a.live && V.persistAuctionWinnerOrder) { V.persistAuctionWinnerOrder(c, a); return; } const o = orderFromAuction(c, a); if (!o) return; log('Winner order created', o.id); c.commit(o.id + ' created'); }, 1, 'auction'));
  if (a.orderId) acts.push({ label: 'Open order ' + a.orderId, style: V.B[1], go: () => c.openOrder(a.orderId) });
  if (l && ((st === 'Closed' && !t) || st === 'Cancelled')) acts.push(V.act(c, 'Relist lot', () => { if (a.live && V.persistAuction) { V.persistAuction(c, { productId: l.productId, name: l.name, qty: a.qty, unit: l.unit, start: Math.round(a.start * 0.95), step: a.step, reserve: a.reserve || undefined, opens: now() + M.H, hours: 72 }); c.setState({ drawer: null }); c.commit('Relisted at ' + M.money(Math.round(a.start * 0.95))); return; } const n = { id: 'A-' + (313 + db.auctions.length), lot: a.lot, qty: a.qty, start: Math.round(a.start * 0.95), step: a.step, opens: now() + M.H, closes: now() + 73 * M.H, reminders: 0, bids: [], paused: false, cancelled: '', closed: false, winner: null, orderId: null, extended: 0 }; db.auctions.unshift(n); log('Relisted as ' + n.id); c.commit('Relisted as ' + n.id + ' at ' + M.money(n.start)); c.openDrawer('auction', n.id); }, 1, 'auction'));
  const lotName = l && l.name ? l.name : (a.name || a.lot || a.id);
  const lotUnit = l && l.unit ? l.unit : '';
  const lotGrade = l && l.grade ? l.grade : '';
  return { title: a.id + ' · ' + lotName, sub: (l ? l.id : (a.lot || 'No catalogue lot')) + ' · ' + M.qfmt(a.qty, lotUnit) + (lotGrade ? ' · ' + lotGrade : ''), pill: st, pillStyle: V.pill(st === 'Live' ? 'ok' : st === 'Cancelled' ? 'err' : st === 'Upcoming' ? 'info' : 'mute'),
    fields: [kv('Starting bid', M.money(a.start)), kv('Bid step', M.money(a.step)), kv('Opens', M.fmt(a.opens)), kv('Closes', M.fmt(a.closes) + (st === 'Live' ? ' · in ' + M.left(a.closes - now()) : '')), kv('Top bid', t ? M.money(t.amt) + ' · ' + M.cname(M.cust(db, t.cust)) : 'No bids'), kv('Reminders set', a.reminders), kv('Extended', a.extended ? a.extended + ' h' : ''), kv('Cancelled because', a.cancelled), kv('Winner order', a.orderId)],
    sections: [{ title: 'Bids · ' + (Array.isArray(a.bids) ? a.bids.length : 0), items: (Array.isArray(a.bids) ? a.bids : []).slice().reverse().slice(0, 14).map((b?: any) => ({ t: M.money(b.amt), s: M.cname(M.cust(db, b.cust)) + (b.auto ? ' · auto-bid up to ' + M.money(b.max) : ''), r: M.fmt(b.at) })) }],
    inputs: st === 'Live' || st === 'Upcoming' || st === 'Paused' ? [V.inp(c, 'reason', 'Cancellation reason', '', true)] : [], actions: acts };
};
D.newAuction = (c?: any) => {
  const db = c.state.db, lots = db.lots.filter((l?: any) => l.status === 'listed' && l.avail > 0);
  return { title: 'New auction', sub: 'Lists part of a catalogue lot for timed bidding', fields: [], sections: [{ title: 'Lots with stock', items: lots.slice(0, 8).map((l?: any) => ({ t: l.id + ' · ' + l.name, s: MBA.qfmt(l.avail, l.unit) + ' available · ' + (l.grade || 'not tested') })) }],
    inputs: [V.inp(c, 'lot', 'Lot ID', lots[0] ? lots[0].id : ''), V.inp(c, 'qty', 'Quantity', lots[0] ? lots[0].min : ''), V.inp(c, 'start', 'Starting bid ($) — set from today’s market rate', ''), V.inp(c, 'step', 'Bid step ($)', db.settings.bidStep), V.inp(c, 'hours', 'Duration (hours)', 48)],
    actions: [V.act(c, 'Schedule auction', () => { const l = MBA.lot(db, V.val(c, 'lot', '')); if (!l) return c.toast('No lot with that ID'); const q = +V.val(c, 'qty', 0); if (!(q > 0) || q > l.avail) return c.toast('Quantity must be between 0 and ' + MBA.qfmt(l.avail, l.unit)); const a = { id: 'A-' + (313 + db.auctions.length), lot: l.id, qty: q, start: +V.val(c, 'start', 0), step: +V.val(c, 'step', 500), opens: now() + MBA.H, closes: now() + (1 + +V.val(c, 'hours', 48)) * MBA.H, reminders: 0, bids: [], paused: false, cancelled: '', closed: false, winner: null, orderId: null, extended: 0 }; db.auctions.unshift(a); V.log(c, 'Auction', a.id, 'Auction scheduled', '', MBA.money(a.start)); c.form = {}; c.commit(a.id + ' scheduled'); c.openDrawer('auction', a.id); }, 1, 'auction')] };
};
D.lot = (c?: any, id?: any) => {
  const db = c.state.db, l = MBA.lot(db, id), M = MBA, acts = [];
  acts.push(V.act(c, 'Save changes', () => { const p = +V.val(c, 'ref', l.ref), a = +V.val(c, 'avail', l.avail), mn = +V.val(c, 'min', l.min); if ([p, a, mn].some(x => isNaN(x) || x < 0)) return c.toast('Enter valid numbers'); const before = M.money(l.ref) + ' · ' + l.avail, oldRef = l.ref, oldMin = l.min; l.ref = p; l.avail = a; l.min = mn; if (a === 0 && l.status === 'listed') l.status = 'sold out'; if (a > 0 && l.status === 'sold out') l.status = 'listed'; V.log(c, 'Lot', l.id, 'Lot updated', before, M.money(p) + ' · ' + a); c.form = {}; c.commit(l.id + ' saved'); if (l.live && V.persistLot) V.persistLot(c, l, { minOrder: mn !== oldMin ? mn : undefined, referencePrice: p !== oldRef ? p : undefined }); }, 1, 'catalogue'));
  if (l.status === 'draft') acts.push(V.act(c, 'Publish', () => { if (!l.cert) return c.toast('Add a test report before publishing'); l.status = 'listed'; V.log(c, 'Lot', l.id, 'Published'); c.commit(l.id + ' is live in the app'); if (l.live && V.persistLot) V.persistLot(c, l); }, 4, 'catalogue'));
  if (l.status === 'listed' || l.status === 'sold out') acts.push(V.act(c, 'Archive', () => { l.status = 'archived'; V.log(c, 'Lot', l.id, 'Archived'); c.commit(l.id + ' archived'); if (l.live && V.persistLot) V.persistLot(c, l); }, 3, 'catalogue'));
  if (l.status === 'archived') acts.push(V.act(c, 'Relist', () => { l.status = l.avail > 0 ? 'listed' : 'sold out'; V.log(c, 'Lot', l.id, 'Relisted'); c.commit(l.id + ' relisted'); if (l.live && V.persistLot) V.persistLot(c, l); }, 2, 'catalogue'));
  if (l.live) acts.push(V.act(c, l.onHold ? 'Release hold' : 'Hold stock', () => {
    const r = l.onHold ? '' : String(V.val(c, 'holdReason', '') || '').trim();
    if (!l.onHold && r.length < 3) return c.toast('Say why this stock is on hold (at least 3 characters)');
    const next = !l.onHold;
    l.onHold = next;
    l.holdReason = r;
    if (V.persistHold) V.persistHold(c, Object.assign({}, l, { onHold: next, holdReason: r }));
    c.form = {};
    c.commit(next ? l.id + ' held' : l.id + ' hold released');
  }, 2, 'catalogue'));
  const cat = M.CATS.find((k?: any) => k[2].some((m?: any) => m[0] === l.mineral));
  return { title: l.name, sub: l.id + ' · ' + (cat ? cat[1] : '') + ' · ' + l.origin, pill: l.status, pillStyle: V.pill(l.status === 'listed' ? 'ok' : l.status === 'draft' ? 'info' : 'mute'),
    fields: [kv('Form', l.form), kv('Grade', l.grade || 'Not tested'), kv('Unit', l.unit + ' (allowed: g, kg, t, ct)'), kv('Testing lab', l.lab), kv('Certificate', l.cert), kv('Images', l.images), kv('Documents', l.docs.join(', '))],
    sections: [{ title: 'Orders on this lot', items: db.orders.filter((o?: any) => o.items && o.items.some((i?: any) => i.lot === l.id)).map((o?: any) => ({ t: o.id, s: M.nextInfo(o).label, r: M.qfmt(o.items.find((i?: any) => i.lot === l.id).qty, l.unit), go: () => c.openOrder(o.id) })) }],
    inputs: [V.inp(c, 'ref', 'Reference price per ' + l.unit + ' ($)', l.ref), V.inp(c, 'avail', 'Available (' + l.unit + ')', l.avail), V.inp(c, 'min', 'Minimum order (' + l.unit + ')', l.min)].concat(l.live && !l.onHold ? [V.inp(c, 'holdReason', 'Reason for holding stock', '')] : []), actions: acts };
};
D.newLot = (c?: any) => {
  const db = c.state.db;
  return { title: 'New lot', sub: 'Saved as a draft. Publishing needs a test report.', fields: [], sections: [],
    inputs: [V.inp(c, 'name', 'Name', ''), V.inp(c, 'mineral', 'Mineral (e.g. gold, copper, lithium)', 'gold'), V.inp(c, 'form', 'Form', 'Doré bar'), V.inp(c, 'unit', 'Unit (g, kg, t or ct)', 'kg'), V.inp(c, 'avail', 'Available', ''), V.inp(c, 'min', 'Minimum order', ''), V.inp(c, 'ref', 'Reference price per unit ($)', ''), V.inp(c, 'origin', 'Origin', ''), V.inp(c, 'cert', 'Test report number (optional)', '')],
    actions: [V.act(c, 'Save as draft', () => { const u = V.val(c, 'unit', 'kg'); if (['g', 'kg', 't', 'ct'].indexOf(u) < 0) return c.toast('Unit must be g, kg, t or ct'); const name = V.val(c, 'name', ''); if (!name) return c.toast('Name the lot'); if (db.live && V.persistLotCreate) { V.persistLotCreate(c, { name, mineral: V.val(c, 'mineral', 'gold'), unit: u, avail: +V.val(c, 'avail', 0), origin: V.val(c, 'origin', ''), form: V.val(c, 'form', ''), grade: V.val(c, 'cert', '') }); return; } const l = { id: 'N-' + (8000 + db.lots.length), mineral: V.val(c, 'mineral', 'gold'), name, form: V.val(c, 'form', ''), avail: +V.val(c, 'avail', 0), unit: u, min: +V.val(c, 'min', 0), grade: '', lab: '', cert: V.val(c, 'cert', ''), origin: V.val(c, 'origin', ''), ref: +V.val(c, 'ref', 0), status: 'draft', images: 0, docs: [], reserved: 0 }; db.lots.unshift(l); V.log(c, 'Lot', l.id, 'Lot created'); c.form = {}; c.commit(l.id + ' saved as draft'); c.openDrawer('lot', l.id); }, 1, 'catalogue')] };
};
D.refund = (c?: any, ref?: any) => {
  const db = c.state.db, r = db.refunds.find((x?: any) => x.ref === ref), o = db.orders.find((x?: any) => x.id === r.order), cu = MBA.cust(db, r.cust), M = MBA, S = db.settings, acts = [];
  const need = r.amount > S.refundApprover;
  const clear = () => { if (o && o.hold && o.hold.t === 'refund') { o.hold = null; o.sAt = now(); } };
  const set = (st?: any, msg?: any, note?: any) => { const b = r.status; r.status = st; r.sAt = now(); V.log(c, 'Refund', r.ref, 'Refund ' + st, b, st, note); V.tell(c, r.cust, 'Refund ' + st, r.ref); c.form = {}; c.commit(msg); if (r.live && V.persistRefund) V.persistRefund(c, r, st, { reason: note, bankRef: r.bankRef }); };
  if (r.status === 'requested') acts.push(V.act(c, 'Start review', () => set('review', 'Review started'), 1, 'finance'));
  if (r.status === 'review') {
    if (need && r.approvals.length < 2) acts.push(V.act(c, 'Approve (' + r.approvals.length + ' of 2)', () => { if (r.approvals.indexOf(V.me(c).name) >= 0) return c.toast('A different finance approver must sign'); r.approvals.push(V.me(c).name); if (r.approvals.length >= 2) set('approved', 'Refund approved'); else c.commit('Approval recorded (1 of 2)'); }, 1, 'finance'));
    else acts.push(V.act(c, 'Approve refund', () => { r.approvals.push(V.me(c).name); set('approved', 'Refund approved'); }, 1, 'finance'));
    if (need && r.approvals.length === 1) acts.push({ label: 'Simulate second approver', style: V.B[2], go: () => { r.approvals.push(['Ngozi Obi', 'Adaeze Okafor'].find(x => r.approvals.indexOf(x) < 0)); set('approved', 'Refund approved'); } });
    acts.push(V.act(c, 'Decline', () => { const x = V.val(c, 'reason', ''); if (!x) return c.toast('Add a reason — the customer sees it'); r.declineReason = x; clear(); set('declined', 'Refund declined', x); }, 3, 'finance'));
  }
  if (r.status === 'approved') acts.push(V.act(c, 'Mark processing', () => set('processing', 'Refund sent to ' + (r.dest.method === 'bank' ? 'bank' : 'original method')), 1, 'finance'));
  if (r.status === 'processing') acts.push(V.act(c, 'Mark refunded', () => { const b = V.val(c, 'bankRef', ''); if (!b) return c.toast('Add the bank or gateway reference'); r.bankRef = b; if (o) { o.refunded = (o.refunded || 0) + r.amount; if (r.type === 'full') o.refundedFull = true; } M.issueDoc(db, 'Refund receipt', r.ref, 'refund', r.ref, now(), 'issued', V.me(c).name); clear(); set('refunded', 'Refunded · receipt ' + r.ref + ' issued'); }, 4, 'finance'));
  if (o) acts.push({ label: 'Open order', style: V.B[2], go: () => c.openOrder(o.id) });
  const inputs = r.status === 'review' ? [V.inp(c, 'reason', 'Decline reason (shown to customer)', '', true)] : r.status === 'processing' ? [V.inp(c, 'bankRef', 'Bank or gateway reference', 'RF-' + r.ref.slice(-4))] : [];
  return { title: r.ref, sub: r.order + ' · ' + M.cname(cu), pill: r.status, pillStyle: V.pill(r.status === 'refunded' ? 'ok' : r.status === 'declined' ? 'err' : 'warn'),
    fields: [kv('Type', r.type), kv('Amount', M.money(r.amount) + (need ? ' · needs two approvers' : '')), kv('Paid on order', o && o.pay ? M.money(o.pay.amount) + ' by ' + o.pay.method : ''), kv('Reason', r.reason), kv('Customer note', r.note), kv('Refund to', r.dest.method === 'bank' ? r.dest.bank + ' · ' + r.dest.account + ' · ' + r.dest.code : 'Original payment method'), kv('Evidence', r.evidence.join(', ')), kv('Approvals', r.approvals.join(', ')), kv('Declined because', r.declineReason), kv('Bank reference', r.bankRef), kv('Requested', M.fmt(r.at)), kv('Customer sees money in', S.refundDays + ' working days')],
    sections: [], inputs, actions: acts };
};
D.doc = (c?: any, no?: any) => {
  const db = c.state.db, d = db.docs.find((x?: any) => x.no === no), M = MBA, acts = [];
  const o = db.orders.find((x?: any) => x.id === d.eid);
  if (o) acts.push({ label: 'Open ' + o.id, style: V.B[2], go: () => c.openOrder(o.id) });
  if (d.status === 'issued' || d.status === 'processing') {
    acts.push(V.act(c, 'Reissue new version', () => { const n = Object.assign({}, d, { ver: d.ver + 1, at: now(), by: V.me(c).name, status: 'issued' }); d.status = 'replaced'; db.docs.unshift(n); V.log(c, 'Document', d.no, 'Reissued', 'v' + d.ver, 'v' + n.ver); c.commit(d.no + ' v' + n.ver + ' issued'); if (d.live && V.persistDocument) V.persistDocument(c, d, 'reissue', V.val(c, 'reason', 'Reissued from the console')); }, 2, 'ops'));
    acts.push(V.act(c, 'Cancel document', () => { const r = V.val(c, 'reason', ''); if (!r) return c.toast('Add a reason'); d.status = 'cancelled'; d.reason = r; V.log(c, 'Document', d.no, 'Cancelled', 'issued', 'cancelled', r); c.commit(d.no + ' cancelled — no longer valid'); if (d.live && V.persistDocument) V.persistDocument(c, d, 'cancel', r); }, 3, 'ops'));
  if (d.live) {
    acts.push({ label: 'Upload file', style: V.B[1], go: () => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/pdf,image/png,image/jpeg,image/webp'; input.onchange = () => { const file = input.files && input.files[0]; if (!file || !V.persistUpload) return; const reader = new FileReader(); reader.onload = () => { const raw = String(reader.result || ''); const base64 = raw.slice(raw.indexOf(',') + 1); V.persistUpload(c, d, { filename: file.name, contentType: file.type, base64 }); }; reader.readAsDataURL(file); }; input.click(); } });
    if (d.fileId) acts.push({ label: 'Download', style: V.B[2], go: () => V.downloadDocument && V.downloadDocument(c, d) });
  }
  }
  const tpl = db.dtpl.find((t?: any) => d.type.indexOf(t.name.split(' ')[0]) >= 0) || db.dtpl[0] || { name: 'Document', ver: d.ver || 1, body: '{{number}} · {{status}} · {{customer_name}}' };
  const cu = o ? MBA.cust(db, o.cust) : null;
  return { title: d.type, sub: d.no + ' · v' + d.ver, pill: d.status, pillStyle: V.pill(d.status === 'issued' ? 'ok' : d.status === 'cancelled' ? 'err' : 'mute'),
    fields: [kv('Linked record', d.eid), kv('Issued', M.fmt(d.at)), kv('Issued by', d.by), kv('Template', tpl.name + ' v' + tpl.ver), kv('Cancelled because', d.reason)],
    text: tpl.body.replace('{{number}}', d.no).replace('{{issue_date}}', M.date(d.at)).replace('{{status}}', d.status).replace('{{customer_name}}', cu ? cu.name : '—').replace('{{customer_business}}', cu ? cu.business || 'Individual' : '—').replace('{{line_items}}', o ? V.itemsText(db, o) + (o.total ? ' · ' + M.money(o.total) : '') : '').replace('{{signatory}}', 'Tunde Adebayo, Head of Trading'),
    sections: [], inputs: d.status === 'issued' || d.status === 'processing' ? [V.inp(c, 'reason', 'Reason for cancelling (shown to the customer)', '')] : [], actions: acts };
};
D.tpl = (c?: any, id?: any) => {
  const db = c.state.db, t = db.dtpl.find((x?: any) => x.id === id);
  return { title: t.name, sub: 'Template v' + t.ver + ' · updated ' + MBA.date(t.updated), fields: [],
    sections: [{ title: 'Placeholders', items: ['{{number}}', '{{issue_date}}', '{{status}}', '{{customer_name}}', '{{customer_business}}', '{{line_items}}', '{{signatory}}'].map(p => ({ t: p })) }],
    inputs: [V.inp(c, 'body', 'Template body', t.body, true)],
    actions: [V.act(c, 'Save as v' + (t.ver + 1), () => { const b = V.val(c, 'body', t.body); if (b === t.body) return c.toast('No changes'); t.body = b; t.ver++; t.updated = now(); V.log(c, 'Template', t.name, 'Template updated', 'v' + (t.ver - 1), 'v' + t.ver); c.form = {}; c.commit(t.name + ' saved as v' + t.ver + ' — new documents use it'); if (c.state.db.live && V.persistTemplate) V.persistTemplate(c, { id: t.id, name: t.name, body: b }); }, 1, 'settings')] };
};
D.thread = (c?: any, id?: any) => {
  const db = c.state.db, t = db.threads.find((x?: any) => x.id === id), cu = MBA.cust(db, t.cust), acts = [];
  if (t.unread) t.unread = 0;
  acts.push(V.act(c, 'Send reply', () => { const r = (c.state.reply || '').trim(); if (!r) return c.toast('Write a reply'); t.msgs.push({ from: 'admin', who: V.me(c).name, text: r, at: now() }); t.status = 'open'; V.tell(c, t.cust, 'New message from Mineral Bridge', t.ref || t.id); V.log(c, 'Support', t.id, 'Replied'); c.setState({ reply: '' }); c.commit('Reply sent'); if (t.live && V.persistSupportReply) V.persistSupportReply(c, t, r); }, 1, 'support'));
  acts.push(V.act(c, t.status === 'resolved' ? 'Reopen' : 'Mark resolved', () => { t.status = t.status === 'resolved' ? 'open' : 'resolved'; V.log(c, 'Support', t.id, t.status === 'resolved' ? 'Resolved' : 'Reopened'); c.commit(t.id + ' ' + t.status); if (t.live && V.persistSupportStatus) V.persistSupportStatus(c, t, t.status); }, 2, 'support'));
  if (t.assignee !== V.me(c).name) acts.push(V.act(c, 'Assign to me', () => { const b = t.assignee; t.assignee = V.me(c).name; V.log(c, 'Support', t.id, 'Reassigned', b, t.assignee); c.commit('Assigned to you'); if (t.live && V.persistSupportAssign) V.persistSupportAssign(c, t); }, 2, 'support'));
  const o = t.ref && db.orders.find((x?: any) => x.id === t.ref);
  if (o) acts.push({ label: 'Open ' + o.id, style: V.B[2], go: () => c.openOrder(o.id) });
  return { title: cu.name + ' · ' + t.tag, sub: t.id + (t.ref ? ' · ' + t.ref : '') + ' · assigned to ' + t.assignee, pill: t.status, pillStyle: V.pill(t.status === 'resolved' ? 'ok' : 'info'), fields: [],
    sections: [{ title: 'Conversation', items: t.msgs.map((m?: any) => ({ t: m.text, s: (m.from === 'cust' ? cu.name : m.who) + ' · ' + MBA.fmt(m.at), mine: m.from === 'admin' })) }],
    reply: true, replies: MBA.SAVED.map((s?: any) => ({ label: s.length > 46 ? s.slice(0, 44) + '…' : s, go: () => c.setState({ reply: s }) })), inputs: [], actions: acts };
};
D.notif = (c?: any, i?: any) => {
  const db = c.state.db, d = db.deliveries[i], cu = MBA.cust(db, d.cust);
  return { title: d.event, sub: cu.name + ' · ' + d.channel, pill: d.status, pillStyle: V.pill(d.status === 'failed' ? 'err' : 'ok'),
    fields: [kv('Sent', MBA.fmt(d.at)), kv('Record', d.ref), kv('To', d.channel === 'email' ? cu.email : d.channel === 'push' ? 'Mineral Bridge app' : cu.whatsapp), kv('Customer channels', ['email', 'sms', 'whatsapp', 'push'].filter(k => cu.prefs[k]).join(', '))], sections: [], inputs: [],
    actions: d.status === 'failed' ? [V.act(c, 'Retry delivery', () => { d.status = 'delivered'; d.at = now(); V.log(c, 'Notification', d.ref, 'Retried ' + d.channel); c.commit('Delivered by ' + d.channel); if (d.live && V.persistNotificationRetry) V.persistNotificationRetry(c, d); }, 1, 'support')] : [] };
};
D.partner = (c?: any, id?: any) => {
  const p = c.state.db.partners.find((x?: any) => x.id === id);
  return { title: p.name, sub: p.modes + ' · ' + p.regions, pill: p.active ? 'active' : 'paused', pillStyle: V.pill(p.active ? 'ok' : 'mute'), fields: [kv('Type', p.type), kv('Contact', p.contact)], sections: [{ title: 'Shipments', items: c.state.db.orders.filter((o?: any) => o.ship && o.ship.partner === p.name).map((o?: any) => ({ t: o.ship.id + ' · ' + o.id, s: o.ship.status, go: () => c.openOrder(o.id) })) }], inputs: [],
    actions: [V.act(c, p.active ? 'Pause partner' : 'Reactivate', () => { p.active = !p.active; V.log(c, 'Partner', p.name, p.active ? 'Reactivated' : 'Paused'); c.commit(p.name + (p.active ? ' active' : ' paused — not offered for new assignments')); if (p.live && V.persistPartner) V.persistPartner(c, p); }, p.active ? 3 : 1, p.type === 'logistics' ? 'logistics' : 'inspection')] };
};
D.admin = (c?: any, id?: any) => {
  const a = c.state.db.admins.find((x?: any) => x.id === id), perms = a.role === 'super' ? ['everything'] : (MBA.PERMS[a.role] || []);
  return { title: a.name, sub: V.roleLabel(a.role) + ' · ' + a.email, pill: a.status, pillStyle: V.pill(a.status === 'active' ? 'ok' : 'mute'), fields: [kv('Two-factor', a.tfa ? 'On · 4-digit code by email or WhatsApp' : 'Reset — sets up on next sign-in'), kv('Can do', perms.join(', '))], sections: [], inputs: [],
    actions: [V.act(c, 'Reset 2FA', () => { if (a.live) return c.toast('Resetting 2FA is not available from the console yet'); a.tfa = false; V.log(c, 'Admin', a.email, '2FA reset'); c.commit('2FA reset for ' + a.name); }, 2, 'settings'), V.act(c, a.status === 'active' ? 'Disable' : 'Enable', () => { if (a.email === V.me(c).email) return c.toast('You cannot disable yourself'); if (a.live && c.state.db.live && V.persistAdminStatus) { V.persistAdminStatus(c, a, a.status === 'active'); return; } a.status = a.status === 'active' ? 'disabled' : 'active'; V.log(c, 'Admin', a.email, a.status === 'active' ? 'Enabled' : 'Disabled'); c.commit(a.name + ' ' + a.status); }, a.status === 'active' ? 3 : 1, 'settings')] };
};
D.newAdmin = (c?: any) => ({ title: 'Invite admin', sub: 'A temporary password is created and shown once. They sign in with that password.', fields: [], sections: [{ title: 'Roles', items: MBA.ROLES.map((r?: any) => ({ t: r[1], s: r[0] })) }],
  inputs: [V.inp(c, 'name', 'Full name', ''), V.inp(c, 'email', 'Work email', ''), V.inp(c, 'role', 'Role key (e.g. finance, support)', 'support')],
  actions: [V.act(c, 'Send invite', () => { const db = c.state.db, r = V.val(c, 'role', ''), e = V.val(c, 'email', ''), name = V.val(c, 'name', e); if (!MBA.ROLES.some((x?: any) => x[0] === r)) return c.toast('Unknown role'); if (e.indexOf('@') < 0) return c.toast('Enter a work email'); if (db.live && V.persistInvite) { V.persistInvite(c, { name, email: e, roleKey: r }); c.form = {}; c.commit('Invite saved for ' + e); return; } const a = { id: 'AD-' + (db.admins.length + 1), role: r, name, email: e, tfa: false, status: 'invited' }; db.admins.push(a); V.log(c, 'Admin', e, 'Invited', '', V.roleLabel(r)); c.form = {}; c.commit('Invite kept in this demo for ' + e); c.openDrawer('admin', a.id); }, 1, 'settings')] });
V.D = D;
V.drawer = (c?: any) => {
  const d = c.state.drawer; if (!d || !D[d.type]) return { open: false };
  let v; try { v = D[d.type](c, d.id); } catch { return { open: false }; }
  return Object.assign({ open: true, key: d.type + '-' + d.id, pill: '', pillStyle: 'display:none;', fields: [], sections: [], inputs: [], actions: [], text: '', replies: [], reply: false }, v, {
    hasFields: !!(v.fields && v.fields.length), hasPreview: !!(v.preview), previewStyle: v.preview && v.preview.img ? 'width:100%; height:260px; flex-shrink:0; border-radius:14px; border:1px solid var(--line); background:var(--soft) center/contain no-repeat url("' + v.preview.img + '");' : 'display:none;', hasPreviewImg: !!(v.preview && v.preview.img), previewPh: v.preview && !v.preview.img ? v.preview.ph || 'image' : '', hasPreviewPh: !!(v.preview && !v.preview.img), hasText: !!v.text, hasInputs: !!(v.inputs && v.inputs.length), hasReply: !!v.reply, replyText: c.state.reply || '', setReply: (e?: any) => c.setState({ reply: e.target.value }),
    sections: (v.sections || []).filter((s?: any) => s.items && s.items.length).map((s?: any) => ({ title: s.title, items: s.items.map((x?: any) => ({ t: x.t, s: x.s || '', r: x.r || '', go: x.go || (() => {}), hasImg: !!x.img, imgStyle: x.img ? 'width:54px; height:54px; flex-shrink:0; border-radius:10px; border:1px solid var(--line); background:var(--soft) center/cover no-repeat url("' + x.img + '");' : 'display:none;', hasPh: !!x.ph, phText: x.ph || '', btns: (x.btns || []).map((b?: any) => ({ label: b.label, go: (e?: any) => { if (e && e.stopPropagation) e.stopPropagation(); b.go(); }, style: 'height:28px; padding:0 10px; border-radius:9px; border:1px solid ' + (b.danger ? 'var(--errBg)' : 'var(--line)') + '; background:' + (b.danger ? 'var(--errBg)' : 'var(--card)') + '; color:' + (b.danger ? 'var(--errInk)' : 'var(--ink)') + '; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap;' })), hasBtns: !!(x.btns && x.btns.length), rStyle: x.pill ? x.pillStyle : 'font-size:11.5px; font-weight:700; color:var(--ink2); white-space:nowrap;', style: 'display:flex; align-items:flex-start; gap:12px; padding:10px 12px; border-radius:12px; border:1px solid var(--line); background:' + (x.mine ? 'var(--hl)' : 'var(--soft)') + ';' + (x.go ? ' cursor:pointer;' : '') })) })),
    close: () => c.setState({ drawer: null, reply: '' })
  });
};

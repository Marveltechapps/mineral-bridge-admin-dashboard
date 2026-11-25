/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-engine.js. Behaviour and styles are kept as designed.
import { MBA } from './registry';

const A = MBA;
const { H, D } = A;
const stages = (o?: any) => o.kind === 'sell' ? A.SELL : A.BUY;
const cust = (db?: any, id?: any) => (db && Array.isArray(db.customers) ? db.customers : []).find((c?: any) => c && c.id === id) || { id, name: id, business: '' };
// Lots are keyed by catalogue reference (`id`). A console page can also hand back the product id
// when that lot was not in the same page as the auction or order that points at it.
const lot = (db?: any, id?: any) => {
  const lots = db && Array.isArray(db.lots) ? db.lots : [];
  if (id == null || id === '') return undefined;
  const key = String(id);
  return lots.find((l?: any) => l && (l.id === key || l.productId === key));
};
/** Name to show for a lot id. The catalogue name when the lot is loaded; otherwise the caller's own label. */
const lotName = (db?: any, id?: any, fallback?: any) => {
  const l = lot(db, id);
  if (l && l.name) return l.name;
  if (fallback != null && String(fallback).trim() !== '') return String(fallback);
  if (id != null && String(id).trim() !== '') return String(id);
  return '';
};
const cname = (c?: any) => c.business || c.name;
const tail = (id?: any) => id.slice(-5);

function issueDoc(db?: any, type?: any, no?: any, entity?: any, eid?: any, at?: any, status?: any, by?: any) {
  db.docs.forEach((d?: any) => { if (d.no === no && d.status !== 'cancelled') d.status = 'replaced'; });
  db.docs.unshift({ no, type, entity, eid, ver: 1, status: status || 'issued', at, by: by || 'System', reason: '' });
}
function nextInfo(o?: any) {
  const S = stages(o);
  if (o.rejected) return { done: true, label: 'Rejected', tone: 'err' };
  if (o.refundedFull) return { done: true, label: 'Refunded', tone: 'mute' };
  if (o.stage >= S.length) return { done: true, label: 'Completed', tone: 'ok' };
  if (o.hold) { const h = A.HOLDS[o.hold.t]; return { key: 'hold', label: h.label, owner: h.owner, role: h.role, hold: true, mb: h.owner !== 'cust', tone: 'warn' }; }
  const s = S[o.stage];
  return { key: s.key, label: s.label, owner: s.owner, role: s.role, mb: s.owner !== 'cust', tone: s.owner === 'cust' ? 'mute' : 'gold' };
}
function sellValue(o?: any) { const byName: any = { 'Copper cathode': 9600, 'Gold concentrate': 2900 }; return Math.round(o.sell.qty * (byName[o.sell.name] || A.SELL_REF[o.sell.mineral] || 1000)); }

function stageData(db?: any, o?: any, key?: any, at?: any, p?: any, seed?: any) {
  p = p || {};
  const t = tail(o.id), c = cust(db, o.cust), S = db.settings;
  const doc = (type?: any, no?: any, st?: any) => issueDoc(db, type, no, 'order', o.id, at, st, seed ? 'System' : p.by);
  const ev = (label?: any, loc?: any) => { o.ship.events.push({ t: label, at, loc: loc || '', note: p.note || '' }); o.ship.status = label; };
  if (key === 'accepted' && !seed) o.items.forEach((it?: any) => { const l = lot(db, it.lot); if (l) { l.avail = +(l.avail - it.qty).toFixed(3); if (l.avail <= 0) { l.avail = 0; l.status = 'sold out'; } } });
  if (key === 'quote') {
    const rev = o.quotes.length + 1;
    o.quotes.forEach((q?: any) => { if (q.status === 'issued') q.status = 'replaced'; });
    let q;
    if (o.kind === 'buy') {
      const manual = !seed;
      const lines = o.items.map((it?: any, i?: any) => { const l = lot(db, it.lot) || {}; const price = manual ? +p['price' + i] || 0 : Math.round((l.ref || 0) * it.qty * (rev > 1 ? 0.985 : 1)); return { name: l.name || it.lot, qty: it.qty, unit: l.unit || '', price }; });
      const prod = lines.reduce((a?: any, x?: any) => a + x.price, 0), fee = manual ? +p.fee || 0 : Math.round(prod * S.fee / 100), tr = manual ? +p.transport || 0 : S.transport, oth = manual ? +p.other || 0 : 0;
      q = { no: 'Q-' + t + (rev > 1 ? '-R' + rev : ''), rev, lines, prod, fee, transport: tr, other: oth, otherLabel: p.otherLabel || '', rate: p.rate || '', total: prod + fee + tr + oth, valid: at + (p.valid != null ? +p.valid : S.buyValidity) * D, at, status: 'issued' };
    } else {
      const offer = !seed ? Math.round(+p.offer || 0) : Math.round(sellValue(o) * (rev > 1 ? 0.9 : 0.93)), ded = !seed ? Math.round(+p.deduct || 0) : 0, total = offer - ded;
      q = { no: 'Q-' + t + (rev > 1 ? '-R' + rev : ''), rev, lines: [{ name: o.sell.name, qty: o.sell.qty, unit: o.sell.unit, price: offer }], prod: offer, fee: 0, transport: 0, deduct: ded, deductLabel: p.deductLabel || '', rate: p.rate || '', total, valid: at + (p.valid != null ? +p.valid : S.sellValidity) * H, at, status: 'issued', cond: 'Subject to Mineral Bridge inspection and SGS test report' };
    }
    o.quotes.push(q); o.total = q.total; doc('Price quotation', q.no);
  }
  if (key === 'quoteOk') { const q = o.quotes[o.quotes.length - 1]; if (q) q.status = 'accepted'; }
  if (key === 'confirmed') o.locked = o.total;
  if (key === 'contract') o.contract = { cust: { name: c.name, at, device: p.device || 'iPhone 15 · Mineral Bridge app v4.0 · 102.89.' + (o.id.charCodeAt(12) % 90) + '.14' } };
  if (key === 'contractMb') { o.contract = o.contract || {}; o.contract.mb = { name: p.signatory || 'Tunde Adebayo · Head of Trading', at }; doc(o.kind === 'sell' ? 'Sell e-contract' : 'E-contract', 'EC-' + t); }
  if (key === 'paid') {
    const m = p.method || 'Bank transfer', amt = o.total;
    o.pay = { method: m, amount: amt, status: 'pending', at, ref: '', attempts: ((o.pay && o.pay.attempts) || 0) + 1, failed: (o.pay && o.pay.failed) || [] };
    if (m === 'Bank transfer') Object.assign(o.pay, { proof: 'transfer-receipt-' + t + '.pdf', bank: 'Sent from ' + (c.country === 'India' ? 'HDFC Bank' : c.country === 'UAE' ? 'Emirates NBD' : 'ING Bank') });
    if (m === 'UPI') Object.assign(o.pay, { upi: (c.name.split(' ')[0] || 'buyer').toLowerCase() + '@okhdfcbank', gateway: 'RZP-UPI-' + t + '81' });
    if (m === 'Net banking') Object.assign(o.pay, { bank: 'ICICI Bank', gateway: 'RZP-NB-' + t + '44' });
    if (m === 'Bitcoin') Object.assign(o.pay, { btc: { rate: 68250, amount: (amt / 68250).toFixed(5), address: 'bc1qmb' + t + 'x7k2v9t0r5lq3wz8', txid: 'f3a9' + t + 'c1e07b5d2a96e48f11c0b3d7e2a', conf: p.conf != null ? p.conf : 2, lockAt: at } });
    if (m.indexOf('Other') === 0) Object.assign(o.pay, { manual: p.docs || 'LC documents' });
    doc('Payment receipt', 'PR-' + t, 'processing');
  }
  if (key === 'payOk') { o.pay.status = 'confirmed'; o.pay.ref = p.ref || ('TRX-' + t); o.pay.confirmedAt = at; db.docs.forEach((d?: any) => { if (d.no === 'PR-' + t && d.status === 'processing') d.status = 'issued'; }); doc('Tax invoice', 'INV-' + t); }
  if (key === 'assigned' && o.kind === 'buy') {
    o.ship = { id: p.sid || 'SSF-' + t, partner: p.partner || 'Sahel Secure Freight', mode: p.mode || 'Road', scope: c.country === 'Nigeria' ? 'Domestic' : 'Cross-border', contact: p.contact || 'Musa Ibrahim · +234 803 555 0142', from: 'Mineral Bridge bonded vault, Apapa, Lagos', to: (cname(c)) + ', ' + c.country, events: [], status: '' };
    ev('Partner assigned', 'Apapa, Lagos'); doc('Consignment note', o.ship.id);
  }
  if (key === 'picked') {
    if (!o.ship) o.ship = { id: 'SSF-' + t, partner: 'Sahel Secure Freight', mode: 'Road', scope: 'Domestic', contact: 'Musa Ibrahim · +234 803 555 0142', from: (o.form && o.form.slot.location) || A.SITES[o.cust] || 'Seller site', to: 'Mineral Bridge bonded vault, Apapa, Lagos', events: [], status: '' };
    ev(o.kind === 'sell' ? 'Collected' : 'Picked up', p.loc || o.ship.from); if (o.kind === 'sell') doc('Consignment note', o.ship.id);
  }
  if (key === 'transit') ev('In transit', p.loc || (o.kind === 'sell' ? 'Ibadan checkpoint' : 'Lagos–Ibadan Expressway'));
  if (key === 'delivered') { ev('Delivered', p.loc || o.ship.to); doc('Proof of delivery', 'POD-' + t); }
  if (key === 'receipt') o.receiptAt = at;
  if (key === 'form') o.form = { payout: { method: 'Bank transfer', account: (c.country === 'Nigeria' ? 'Zenith Bank' : c.country === 'Zambia' ? 'Zanaco' : 'Equity Bank') + ' · ' + (2041883000 + (o.id.charCodeAt(13) * 7)) }, slot: { date: A.day(at + 3 * D), time: '10:00', location: A.SITES[o.cust] || c.country } };
  if (key === 'schedule') o.insp = { agency: p.agency || 'SGS Nigeria', inspector: p.inspector || 'Tunde Afolabi · SGS Nigeria', date: p.date || o.form.slot.date, time: p.time || o.form.slot.time, location: o.form.slot.location };
  if (key === 'inspect') { o.insp.res = { weight: p.weight != null ? +p.weight : o.sell.qty, sample: p.sample || 'SMP-' + t, seals: p.seals || 'MB-SEAL-' + t + '-01 to 04', photos: +(p.photos || 18), result: p.result || 'Quantity and condition verified', notes: p.notes || '', by: p.by || o.insp.inspector, at }; doc('Third-party inspection report', 'SGS-INS-' + t); }
  if (key === 'sgs') { o.sgs = { agency: (o.insp && o.insp.agency) || 'SGS Nigeria', no: p.no || 'SGS-NG-26-' + t, grade: p.grade || o.sell.grade.replace('~', ''), net: p.net != null ? +p.net : o.insp.res.weight, result: p.result || 'Compliant', file: p.file || 'SGS-' + t + '.pdf', at }; doc('Test certificate', o.sgs.no); }
  if (key === 'approved' && !o.payout) {
    const pay = o.form && o.form.payout ? o.form.payout : {};
    o.payout = { amount: o.total, method: pay.method || 'Bank transfer', account: pay.account || '', approvals: [] };
  }
  if (key === 'payout') {
    if (!o.payout) {
      const pay = o.form && o.form.payout ? o.form.payout : {};
      o.payout = { amount: o.total, method: pay.method || 'Bank transfer', account: pay.account || '', approvals: [] };
    }
    o.payout.ref = p.ref || 'ZB-PO-' + t; o.payout.at = at; doc('Payment advice', 'PA-' + t);
  }
  if (key === 'received') {
    const weighed = o.sgs ? o.sgs.net : o.insp && o.insp.res ? o.insp.res.weight : o.sell.qty;
    o.vault = { weight: p.weight != null ? +p.weight : weighed, at };
    if (!o.ship) o.ship = { id: 'SSF-' + t, partner: '', mode: '', scope: '', contact: '', from: '', to: 'Apapa, Lagos', events: [], status: '' };
    ev('Received at vault', 'Apapa, Lagos'); doc('Proof of delivery', 'POD-' + t);
  }
  if (key === 'done') doc('Completion certificate', 'CC-' + t);
}

function build(now?: any) {
  const db: any = { v: 4, lots: [], customers: [], kyc: [], orders: [], auctions: [], refunds: [], docs: [], threads: [], tpl: {}, dtpl: [], deliveries: [], audit: [], settings: Object.assign({}, A.SETTINGS), partners: [], admins: [] };
  db.lots = A.LOTS.map((r?: any) => ({ id: r[0], mineral: r[1], name: r[2], form: r[3], avail: r[4], unit: r[5], min: r[6], grade: r[7], lab: r[8], cert: r[9], origin: r[10], ref: r[11], status: r[12], images: r[13], docs: r[8] ? ['Test report ' + r[9] + '.pdf', 'Certificate of analysis.pdf', 'Origin declaration.pdf'] : [], reserved: 0 }));
  db.customers = A.CUS.map((r?: any) => ({ id: r[0], name: r[1], business: r[2], email: r[3], whatsapp: r[4], country: r[5], role: r[6], buyerType: r[7], sellerType: r[8], signin: r[9], kyc: r[10], status: r[11], joined: now - r[12] * D, prefs: { email: r[13].indexOf('e') >= 0, sms: r[13].indexOf('s') >= 0, whatsapp: r[13].indexOf('w') >= 0, push: r[13].indexOf('p') >= 0 }, suspendReason: r[11] === 'suspended' ? 'KYC rejected — identity could not be verified.' : '' }));
  db.partners = A.PARTNERS.map((p?: any, i?: any) => ({ id: 'PT-' + (i + 1), type: p[0], name: p[1], modes: p[2], regions: p[3], contact: p[4], active: true }));
  db.admins = A.ROLES.map((r?: any, i?: any) => ({ id: 'AD-' + (i + 1), role: r[0], name: r[2], email: r[3], tfa: true, status: 'active' }));
  db.dtpl = A.DOC_TPL.map((n?: any, i?: any) => ({ id: 'TPL-' + (i + 1), name: n, ver: i < 3 ? 4 : 2, updated: now - (20 + i * 3) * D, body: 'MINERAL BRIDGE LTD · 14 Creek Road, Apapa, Lagos\n\n' + n.toUpperCase() + ' {{number}}\nIssued {{issue_date}} · Status {{status}}\n\nParties: {{customer_name}} ({{customer_business}}) and Mineral Bridge Ltd\n\n{{line_items}}\n\nSigned for Mineral Bridge Ltd: {{signatory}}' }));
  // KYC
  db.customers.forEach((c?: any, i?: any) => {
    const kr = A.KYC.find((k?: any) => k[1] === c.id);
    const idType = kr ? kr[2] : (i % 3 === 0 ? 'Passport' : 'National ID');
    const biz = !(A.NO_BIZ.indexOf(c.buyerType) >= 0 || A.NO_BIZ.indexOf(c.sellerType) >= 0);
    const docs = (idType === 'Passport' ? [['passport', 'Passport photo page']] : [['idFront', idType + ' · front'], ['idBack', idType + ' · back']]).concat([['selfie', 'Selfie holding ID'], ['address', 'Proof of address · ' + A.date(now - 40 * D)]]).concat(biz ? [['business', c.role === 'seller' ? 'Mining or dealer licence / registration' : 'Business registration certificate']] : []);
    const status = kr ? kr[4] : 'approved';
    const k: any = { ref: kr ? kr[0] : 'MB-KYC-26-' + (2400 + i * 13), cust: c.id, idType, biz, at: kr ? now - kr[3] * H : c.joined + 2 * H, status, docs: docs.map(d => ({ kind: d[0], label: d[1], status: status === 'approved' ? 'ok' : 'submitted', note: '' })), reason: '', reviewedBy: status === 'approved' ? 'Fatima Bello' : '' };
    if (status === 'requested') { const b = k.docs.find((d?: any) => d.kind === 'business'); if (b) { b.status = 'requested'; b.note = 'The cooperative registration certificate has expired. Please upload the 2026 renewal.'; } k.reason = b ? b.note : ''; }
    if (status === 'rejected') { k.reason = 'The passport photo does not match the selfie.'; k.reviewedBy = 'Fatima Bello'; }
    db.kyc.push(k); c.kycRef = k.ref;
  });
  const addHist = (o?: any, S?: any, n?: any, who?: any) => { for (let i = 0; i < n; i++) { const s = S[i]; const at = o.at + (o.sAt - o.at) * (n <= 1 ? 0 : i / (n - 1)); o.hist.push({ at, who: who(s), role: s.owner === 'cust' ? 'Customer' : (A.ROLES.find((r?: any) => r[0] === s.role) || [])[1] || '', text: s.label, note: '' }); } };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept as in the design source
  const whoFor = (c?: any, _o?: any) => (s?: any) => s.owner === 'cust' ? c.name : s.owner === 'lp' ? 'Sahel Secure Freight · recorded by Kelechi Nwosu' : s.owner === 'sgs' ? 'SGS Nigeria · recorded by Emeka Balogun' : (A.ROLES.find((r?: any) => r[0] === s.role) || [])[2];
  A.BUYS.forEach((r?: any) => {
    const x = r[6] || {};
    const o: any = { id: r[0], kind: 'buy', src: x.src || 'direct', cust: r[1], items: r[2].map((i?: any) => ({ lot: i[0], qty: i[1], entered: i[2] })), stage: r[3], at: now - r[4] * H, sAt: now - r[5] * H, hold: null, rejected: x.rejected || '', quotes: [], hist: [], refunded: 0, total: 0, addr: '' };
    const c = cust(db, o.cust); o.addr = (c.business || c.name) + ', ' + c.country;
    if (x.src) {
      o.total = x.total;
      const labels = ['Won at auction ' + x.src, 'Order accepted', 'Price confirmed at winning bid', 'Auction terms accepted', 'Price confirmed', 'Auction terms accepted as the e-contract', 'E-contract countersigned'];
      labels.forEach((l, i) => o.hist.push({ at: o.at + i * 1000, who: i === 0 ? 'System' : 'System', role: 'Auction', text: l, note: '' }));
      issueDoc(db, 'Auction result certificate', 'AR-' + x.src, 'auction', x.src, o.at, 'issued');
      issueDoc(db, 'Auction sale contract', 'EC-' + tail(o.id), 'order', o.id, o.at, 'issued');
      o.quotes.push({ no: 'Auction ' + x.src, rev: 1, lines: o.items.map((i?: any) => ({ name: (lot(db, i.lot) || {}).name, qty: i.qty, unit: (lot(db, i.lot) || {}).unit, price: x.total })), prod: x.total, fee: 0, transport: 0, total: x.total, valid: o.at, at: o.at, status: 'accepted' });
      o.contract = { cust: { name: c.name, at: o.at, device: 'Auction terms accepted at bidding' }, mb: { name: 'Auction terms', at: o.at } };
      for (let i = 7; i < o.stage; i++) { stageData(db, o, A.BUY[i].key, o.at + (i - 6) * 6 * H, { method: x.method }, true); o.hist.push({ at: o.at + (i - 6) * 6 * H, who: whoFor(c, o)(A.BUY[i]), role: '', text: A.BUY[i].label, note: '' }); }
    } else {
      if (o.rejected) { o.hist.push({ at: o.at, who: c.name, role: 'Customer', text: 'Order placed', note: '' }); o.hist.push({ at: o.sAt, who: 'Chiamaka Eze', role: 'Operations manager', text: 'Order rejected', note: o.rejected }); }
      else {
        addHist(o, A.BUY, o.stage, whoFor(c, o));
        for (let i = 1; i < o.stage; i++) stageData(db, o, A.BUY[i].key, o.hist[i].at, { method: x.method, conf: o.id.slice(-2) === '52' ? 2 : 3 }, true);
      }
    }
    if (x.hold === 'declined') { o.quotes[0].status = 'declined'; o.hold = { t: 'declined', note: 'Price is 3% above our budget for this quarter. Can you revise?', at: o.sAt }; o.hist.push({ at: o.sAt, who: c.name, role: 'Customer', text: 'Quotation declined', note: o.hold.note }); }
    if (x.hold === 'discrepancy') { o.hold = { t: 'discrepancy', note: 'Parcel 18 ct short against the packing list. 6 photos attached.', at: o.sAt + 2 * H, photos: 6 }; o.hist.push({ at: o.hold.at, who: c.name, role: 'Customer', text: 'Delivery discrepancy raised', note: o.hold.note }); }
    if (x.hold === 'refund') o.hold = { t: 'refund', note: '', at: o.sAt };
    db.orders.push(o);
  });
  A.SELLS.forEach((r?: any) => {
    const x = r[6] || {}, s = r[2];
    const o: any = { id: r[0], kind: 'sell', src: 'direct', cust: r[1], sell: { mineral: s[0], name: s[1], qty: s[2], unit: s[3], form: s[4], grade: s[5], photos: s[6], docs: s[7], details: 'Declared by seller. Material stored at ' + (A.SITES[r[1]] || 'seller site') + '.' }, stage: r[3], at: now - r[4] * H, sAt: now - r[5] * H, hold: null, rejected: '', quotes: [], hist: [], total: 0 };
    const c = cust(db, o.cust);
    addHist(o, A.SELL, o.stage, whoFor(c, o));
    for (let i = 1; i < o.stage; i++) stageData(db, o, A.SELL[i].key, o.hist[i].at, {}, true);
    if (o.stage === 10 && o.insp && x.today) { o.insp.date = A.day(now); o.insp.time = '14:00'; }
    if (o.stage === 9 && o.form) o.form.slot.date = A.day(now + 2 * D);
    if (x.hold === 'changes') { o.hold = { t: 'changes', note: 'Please add a close-up photo of the bar stamp and the scale reading.', at: o.sAt }; o.hist.push({ at: o.sAt, who: 'Chiamaka Eze', role: 'Operations manager', text: 'Changes requested', note: o.hold.note }); }
    if (x.hold === 'clarify') { o.hold = { t: 'clarify', note: 'Seller asks why SGS TREO (88.6%) is lower than their own assay (90%).', at: o.sAt + 4 * H }; o.hist.push({ at: o.hold.at, who: c.name, role: 'Customer', text: 'Clarification requested on reports', note: o.hold.note }); }
    if (o.stage === 14 && o.id.slice(-3) === '369') o.payout.approvals = [];
    db.orders.push(o);
  });
  // auctions
  A.AUCTIONS.forEach((r?: any, ai?: any) => {
    const a: any = { id: r[0], lot: r[1], qty: r[2], start: r[3], step: 500, opens: now + r[4] * H, closes: now + r[5] * H, reminders: r[6], bids: [], paused: false, remaining: 0, cancelled: '', closed: r[5] < 0, winner: r[8] || null, orderId: r[9] || null, nextOffered: false, relisted: false, extended: 0 };
    const top = r[7] || 0;
    if (top) {
      const n = Math.max(2, Math.round((top - r[3]) / 500 / (top > 100000 ? 4 : 1)));
      const steps = Math.min(n, 14);
      for (let i = 0; i < steps; i++) {
        const amt = i === steps - 1 ? top : r[3] + Math.round(((top - r[3]) * i / (steps - 1)) / 500) * 500;
        const who = i === steps - 1 && r[8] ? r[8] : A.BIDDERS[(ai + i) % A.BIDDERS.length];
        const t0 = Math.min(a.opens, now), t1 = Math.min(a.closes, now);
        a.bids.push({ cust: who, amt, at: t0 + (t1 - t0) * (i + 1) / (steps + 1), auto: i % 3 === 1, max: i % 3 === 1 ? amt + 3000 : 0 });
      }
      if (r[8]) a.bids[a.bids.length - 1].cust = r[8];
    }
    db.auctions.push(a);
  });
  // refunds
  A.REFUNDS.forEach((r?: any) => {
    const o = db.orders.find((x?: any) => x.id === r[1]);
    const paid = o && o.pay ? o.pay.amount : 0;
    const f = { ref: r[0], order: r[1], cust: o ? o.cust : '', type: r[2], amount: r[3] != null ? r[3] : paid, reason: r[4], note: r[5], dest: r[6], evidence: r[7], status: r[8], at: now - r[9] * H, sAt: now - r[9] * H * 0.6, declineReason: r[8] === 'declined' ? 'The grading report confirms AA quality. Please use the delivery discrepancy process for the shortfall.' : '', bankRef: r[8] === 'refunded' ? 'INGB-RF-55190' : '', approvals: r[8] === 'approved' || r[8] === 'refunded' ? ['Ngozi Obi'] : [], method: o && o.pay ? o.pay.method : '' };
    if (r[8] === 'refunded' && o) { o.refunded = f.amount; issueDoc(db, 'Refund receipt', f.ref, 'refund', f.ref, f.sAt, 'issued'); }
    db.refunds.push(f);
    if (o && o.hold && o.hold.t === 'refund' && ['requested', 'review', 'approved', 'processing'].indexOf(f.status) >= 0) { o.hold.ref = f.ref; o.hold.at = f.at; o.hold.note = f.reason + ' · ' + A.money(f.amount); }
  });
  // threads
  db.threads = A.THREADS.map((r?: any) => ({ id: r[0], cust: r[1], ref: r[2], tag: r[3], unread: r[4], status: r[4] ? 'open' : (r[0] === 'T-804' ? 'resolved' : 'open'), assignee: r[3] === 'Other payment method' ? 'Ngozi Obi' : 'Bola Adeyemi', msgs: r[5].map((m?: any) => ({ from: m[0] === 'c' ? 'cust' : 'admin', who: m[0] === 'c' ? cust(db, r[1]).name : 'Bola Adeyemi', text: m[1], at: now - m[2] * H })) }));
  // audit + deliveries from history
  const ev = [];
  db.orders.forEach((o?: any) => o.hist.forEach((h?: any) => ev.push({ at: h.at, actor: h.who, role: h.role || 'System', entity: o.kind === 'buy' ? 'Order' : 'Sell request', eid: o.id, action: h.text, before: '', after: '', note: h.note || '', ip: h.role === 'Customer' ? 'app' : '102.89.34.' + (20 + (h.at % 80 | 0)) })));
  db.kyc.filter((k?: any) => k.status === 'rejected').forEach((k?: any) => ev.push({ at: k.at + 6 * H, actor: 'Fatima Bello', role: 'Compliance', entity: 'KYC', eid: k.ref, action: 'KYC rejected', before: 'pending', after: 'rejected', note: k.reason, ip: '102.89.34.51' }));
  ev.push({ at: now - 9 * D, actor: 'Adaeze Okafor', role: 'Super admin', entity: 'Setting', eid: 'auctionWindow', action: 'Setting changed', before: '48', after: '72', note: 'Align winner payment window with app v4', ip: '102.89.34.12' });
  db.audit = ev.sort((a, b) => b.at - a.at).slice(0, 220);
  const chans = ['email', 'sms', 'whatsapp', 'push'];
  db.audit.slice(0, 40).forEach((e?: any, i?: any) => { if (e.role === 'Customer' || !e.eid) return; const o = db.orders.find((x?: any) => x.id === e.eid); if (!o) return; const c = cust(db, o.cust); chans.forEach(ch => { if (c.prefs[ch]) db.deliveries.push({ at: e.at + 4000, cust: c.id, event: e.action, ref: e.eid, channel: ch, status: (i + ch.length) % 11 === 0 ? 'failed' : (i % 3 === 0 ? 'sent' : 'delivered') }); }); });
  return db;
}
Object.assign(A, { stages, cust, lot, lotName, cname, tail, issueDoc, nextInfo, stageData, build, sellValue });

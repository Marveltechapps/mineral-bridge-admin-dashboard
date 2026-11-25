/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-v6.js. Behaviour and styles are kept as designed.
import { approvalBlockers, discrepancyRecord, discrepancyState, sellPriceVariation } from '../../../services/console/consoleService';
import { MBA, MBV } from './registry';

const V = MBV, D = V.D, A = MBA;
const now = () => Date.now();
const kv = (k?: any, v?: any) => ({ k, v: v == null || v === '' ? '—' : String(v) });
const F = (k?: any, label?: any, def?: any, type?: any, opts?: any, req?: any) => ({ k, label, def: def == null ? '' : def, type: type || 'text', opts: opts || [], req: !!req });
const ix = (o?: any, key?: any) => A.stages(o).findIndex((s?: any) => s.key === key);
const curKey = (o?: any) => (A.stages(o)[o.stage] || {}).key;
const money = (n?: any) => A.money(n || 0);
const pctTxt = (p?: any) => (p > 0 ? '+' : '') + p.toFixed(2) + '%';

// ---------- seed: one buy order waiting for a logistics partner ----------
const build0 = A.build;
A.build = function (t?: any) {
  // eslint-disable-next-line prefer-rest-params -- kept as in the design source
  const db = build0.apply(this, arguments);
  if (!db.orders.some((o?: any) => o.id === 'MB-ORD-26-10458')) {
    const c = A.cust(db, 'C-1004');
    const o: any = { id: 'MB-ORD-26-10458', kind: 'buy', src: 'direct', cust: 'C-1004', items: [{ lot: 'S-2012', qty: 5, entered: '5 kg' }], stage: 9, at: t - 160 * A.H, sAt: t - 3 * A.H, hold: null, rejected: '', quotes: [], hist: [], refunded: 0, total: 0, addr: (c.business || c.name) + ', ' + c.country };
    for (let i = 0; i < 9; i++) { const s = A.BUY[i], at = o.at + (o.sAt - o.at) * i / 8; o.hist.push({ at, who: s.owner === 'cust' ? c.name : (A.ROLES.find((r?: any) => r[0] === s.role) || [])[2], role: s.owner === 'cust' ? 'Customer' : '', text: s.label, note: '' }); if (i > 0) A.stageData(db, o, s.key, at, { method: 'Bank transfer' }, true); }
    db.orders.unshift(o);
  }
  // realistic weight / grade variation on a few sell requests still before payout
  [['MB-SELL-26-20380', 0.97, 'TREO 88.6%'], ['MB-SELL-26-20374', 0.982, 'Au 43.1 g/t'], ['MB-SELL-26-20369', 0.996, '']].forEach((r: any) => {
    const o = db.orders.find((x?: any) => x.id === r[0]); if (!o || !o.insp || !o.insp.res || (o.payout && o.payout.ref)) return;
    const w = +(o.sell.qty * r[1]).toFixed(3); o.insp.res.weight = w;
    if (o.sgs) { o.sgs.net = +(w - (o.sell.unit === 't' ? 0.01 : 0.001)).toFixed(3); if (r[2]) o.sgs.grade = r[2]; }
  });
  return db;
};

// ---------- logistics partner: pick from the partner list ----------
const sd0 = A.stageData;
A.stageData = function (db?: any, o?: any, key?: any, _at?: any, p?: any) {
  const partnerOf = (value?: any) => (db && db.partners || []).find((x?: any) => x && (x.id === value || x.name === value));
  if (p && p.partner && (key === 'assigned' || key === 'picked')) {
    const pt = partnerOf(p.partner);
    if (pt) {
      const mode = String(pt.modes || '').split(',')[0];
      p.partner = pt.name;
      p.mode = p.mode || (mode ? mode.trim() : '');
      p.contact = p.contact || pt.contact;
    }
  }
  if (p && (key === 'schedule' || key === 'inspect' || key === 'sgs')) {
    const agency = partnerOf(p.agency);
    if (agency) p.agency = agency.name;
    const inspector = partnerOf(p.inspector);
    if (inspector) p.inspector = inspector.name;
  }
  // eslint-disable-next-line prefer-rest-params -- kept as in the design source
  const result = sd0.apply(this, arguments);
  if (key === 'picked' && o && o.ship && p && p.partner) o.ship.partner = p.partner;
  if (key === 'inspect' && o && o.insp && p && p.agency) {
    const agency = partnerOf(p.agency);
    o.insp.agency = agency ? agency.name : p.agency;
  }
  return result;
};
const choiceField = (c?: any, k?: any, label?: any, opts?: any, def?: any) => {
  if (c.form[k] == null && def) c.form[k] = def;
  const cur = c.form[k];
  return { label, isChoice: true, isText: false, isArea: false, value: '', set: () => {}, choices: opts.map((o?: any) => ({ label: o[1], style: V.chip(cur === o[0]), go: () => { c.form[k] = o[0]; c.commit(); } })) };
};
const selectField = (c?: any, k?: any, label?: any, opts?: any) => {
  const cur = c.form[k] == null ? '' : String(c.form[k]);
  return {
    label, isSelect: true, isChoice: false, isText: false, isArea: false, value: cur,
    set: (e?: any) => { c.form[k] = e && e.target ? e.target.value : ''; c.commit(); },
    choices: (opts || []).map((o?: any) => ({ label: o[1], value: o[0], style: '', go: () => { c.form[k] = o[0]; c.commit(); } })),
  };
};

// ---------- price variation ----------
V.variation = (o?: any) => sellPriceVariation(o);
V.markDiscrepancy = (c?: any, o?: any) => {
  const vr = V.variation(o);
  if (!vr || vr.cert == null || (vr.qtyMatch && vr.gradeMatch)) return c.toast('Certified quantity and grade match the declaration. A non-compliant report is corrected by uploading a new certificate.');
  if (o.hold && o.hold.t === 'discrepancy') return c.toast('This request is already held for a quantity discrepancy. Payment stays blocked.');
  V.form(c, 'disc-' + o.id, { title: 'Record quantity discrepancy', sub: o.id + ' · expected ' + A.qfmt(vr.declared, o.sell.unit) + ' · inspected ' + A.qfmt(vr.cert, o.sell.unit), mode: 'New', perm: 'ops', cta: 'Submit for review',
    info: [kv('Expected quantity', A.qfmt(vr.declared, o.sell.unit)), kv('Inspected quantity', A.qfmt(vr.cert, o.sell.unit)), kv('Difference', pctTxt(vr.qtyPct || 0)), kv('Grade declared → certified', (o.sell.grade || '—') + ' → ' + (o.sgs ? o.sgs.grade : '—'))],
    fields: [F('reason', 'Discrepancy reason', '', 'area', null, 1), F('notes', 'Supporting notes or evidence', '', 'area')],
    save: (x?: any) => {
      const reason = String(x.reason || '').trim();
      if (reason.length < 5) return 'Enter the discrepancy reason';
      const note = discrepancyRecord({ declared: vr.declared, actual: Number(vr.cert), unit: o.sell.unit, reason, notes: x.notes, status: 'pending' });
      if (o.live && V.persistDiscrepancy) { V.persistDiscrepancy(c, o, note); return; }
      o.hold = { t: 'discrepancy', note, at: now() };
      o.sAt = now();
      o.hist.push({ at: now(), who: V.me(c).name, role: V.me(c).label, text: 'Quantity discrepancy', note });
      V.tell(c, o.cust, 'Quantity discrepancy on ' + o.id, o.id);
      c.setState({ drawer: null });
      c.commit('Quantity discrepancy submitted — payment stays blocked');
    } });
};
V.requestCorrectedReport = (c?: any, o?: any) => {
  if (!o.sgs || !/non[\s_-]*compliant/i.test(String(o.sgs.result || ''))) return c.toast('The current report is not non-compliant');
  V.form(c, 'corr-' + o.id, { title: 'Request a corrected report', sub: (o.sgs.agency || 'Agency') + ' · ' + o.sgs.no + ' · ' + o.sgs.result, mode: 'Edit', perm: 'inspection', cta: 'Request correction',
    info: [kv('Current result', o.sgs.result), kv('Certificate', o.sgs.no), kv('Grade', o.sgs.grade)],
    fields: [F('note', 'What the agency must correct', o.sgs.remarks || ('Report ' + o.sgs.no + ' is ' + o.sgs.result), 'area', null, 1)],
    save: (x?: any) => {
      const note = String(x.note || '').trim();
      if (note.length < 5) return 'Say what must be corrected';
      if (o.live && V.persistCorrectionRequest) { V.persistCorrectionRequest(c, o, note); return; }
      o.hist.push({ at: now(), who: V.me(c).name, role: V.me(c).label, text: 'Corrected report requested', note });
      c.setState({ drawer: null });
      c.commit('Correction requested. The saved result stays ' + o.sgs.result);
    } });
};
V.recordReinspection = (c?: any, o?: any) => {
  if (!o.insp || !o.insp.res) return c.toast('Record the inspection before a re-inspection');
  const r = o.insp.res;
  V.form(c, 'rein-' + o.id, { title: 'Record re-inspection', sub: o.id + ' · ' + (o.insp.agency || 'Agency') + ' · the certificate is not changed', mode: 'Edit', perm: 'inspection', cta: 'Save re-inspection',
    fields: [F('weight', 'Inspected quantity (' + o.sell.unit + ')', r.weight, 'num', null, 1), F('seals', 'Seal numbers', r.seals, 'text'), F('inspector', 'Agency inspector', o.insp.inspector || '', 'text'), F('result', 'On-site result', r.result || '', 'text', null, 1), F('notes', 'Notes', r.notes || '', 'area')],
    save: (x?: any) => {
      if (!String(x.result || '').trim()) return 'Record the on-site result';
      if (o.live && V.persistReinspection) { V.persistReinspection(c, o, x); return; }
      r.history = (r.history || []).concat([{ weight: r.weight, result: r.result, notes: r.notes, at: now() }]);
      r.weight = +x.weight; r.seals = x.seals; r.result = x.result; r.notes = x.notes || '';
      if (x.inspector) o.insp.inspector = x.inspector;
      o.hist.push({ at: now(), who: V.me(c).name, role: V.me(c).label, text: 'Re-inspection recorded', note: x.result });
      c.setState({ drawer: null });
      c.commit('Re-inspection recorded. The certificate result is unchanged');
    } });
};
const locked = (o?: any) => !!(o.payout && o.payout.ref) || A.nextInfo(o).done;
V.adjustPrice = (c?: any, o?: any) => {
  const vr = V.variation(o) || {};
  if (locked(o)) return c.toast('Payment has already been released — the price can no longer change');
  V.form(c, 'pv-' + o.id, { title: 'Adjust price for variation', sub: o.id + ' · quoted ' + money(vr.quoted) + (vr.cert != null ? ' · certified ' + A.qfmt(vr.cert, o.sell.unit) : ''), mode: 'Edit', perm: 'trading', cta: 'Apply adjustment',
    info: [kv('Declared quantity', A.qfmt(o.sell.qty, o.sell.unit) + ' · ' + o.sell.grade), kv('Certified', vr.cert != null ? A.qfmt(vr.cert, o.sell.unit) + (o.sgs ? ' · ' + o.sgs.grade : '') : 'Not yet certified'), kv('Unit price on the quote', money(vr.unit) + ' / ' + o.sell.unit), kv('Value at certified quantity', vr.fair != null ? money(vr.fair) : '—'), kv('Current payable', money(o.total))],
    fields: [F('total', 'New amount payable to seller ($)', vr.fair != null ? vr.fair : o.total, 'num', null, 1), F('kind', 'Reason', 'qty', 'choice', [['qty', 'Quantity differs'], ['grade', 'Grade / purity differs'], ['both', 'Quantity and grade'], ['market', 'Market moved'], ['other', 'Other']], 1), F('note', 'Explanation shown to the seller', vr.cert != null ? 'Certified ' + A.qfmt(vr.cert, o.sell.unit) + ' against ' + A.qfmt(o.sell.qty, o.sell.unit) + ' declared (' + pctTxt(vr.qtyPct || 0) + ').' : '', 'area', null, 1)],
    save: (x?: any) => {
      if (!(x.total > 0)) return 'Enter an amount above 0';
      if (o.live && V.persistVariation) { V.persistVariation(c, o, x); return; }
      const before = o.total, m = V.me(c);
      o.variations = (o.variations || []).concat([{ from: before, to: x.total, kind: x.kind, note: x.note, at: now(), by: m.name, status: 'awaiting seller' }]);
      o.total = x.total; if (o.payout) o.payout.amount = x.total;
      const q = o.quotes[o.quotes.length - 1]; if (q) { q.adjusted = x.total; }
      A.issueDoc(c.state.db, 'Price adjustment notice', 'PV-' + A.tail(o.id) + '-' + o.variations.length, 'order', o.id, now(), 'issued', m.name);
      o.hist.push({ at: now(), who: m.name, role: m.label, text: 'Price adjusted for variation', note: money(before) + ' → ' + money(x.total) + ' · ' + x.note });
      V.log(c, 'Sell request', o.id, 'Price adjusted', money(before), money(x.total), x.note);
      V.tell(c, o.cust, 'Price adjusted: ' + money(x.total), o.id);
      c.setState({ drawer: null }); c.commit('Payable now ' + money(x.total) + ' (' + (x.total >= before ? '+' : '−') + money(Math.abs(x.total - before)).replace('$', '$') + ')');
    } });
};

// ---------- invoices ----------
const VAT = (cu?: any) => cu.country === 'Nigeria' ? 7.5 : 0;
V.invoiceOf = (db?: any, o?: any) => {
  if (!o.quotes.length || !o.total) return null;
  const q = o.quotes[o.quotes.length - 1], cu = A.cust(db, o.cust);
  const inv = o.invoice || {};
  const lines = q.lines.map((l?: any) => ({ name: l.name, qty: l.qty, unit: l.unit, unitPrice: l.unitPrice || Math.round(l.price / (l.qty || 1)), amount: l.price }));
  const extras = o.kind === 'buy' ? [['Platform fee', q.fee], ['Insured transport', q.transport], [q.otherLabel || 'Other charges', q.other]].filter(x => x[1]) : (q.deduct ? [[q.deductLabel || 'Deductions', -q.deduct]] : []);
  const sub = lines.reduce((s?: any, l?: any) => s + l.amount, 0) + extras.reduce((s, x) => s + x[1], 0);
  const adj = o.kind === 'sell' && o.total !== sub ? o.total - sub : 0;
  const rate = inv.rate != null ? inv.rate : (o.kind === 'buy' ? VAT(cu) : 0), tax = Math.round((sub + adj) * rate / 100);
  return { no: inv.no || (o.kind === 'buy' ? 'INV-' : 'SBI-') + A.tail(o.id), issued: !!inv.no, at: inv.at, due: inv.at ? inv.at + 7 * A.D : null, status: !inv.no ? 'Not generated' : (o.kind === 'buy' ? (o.pay && o.pay.status === 'confirmed' ? 'Paid' : 'Awaiting payment') : (o.payout && o.payout.ref ? 'Paid to seller' : 'Awaiting payout')), lines, extras, adj, sub: sub + adj, rate, tax, total: sub + adj + tax, cust: cu, sent: inv.sent || 0, title: o.kind === 'buy' ? 'Tax invoice' : 'Purchase invoice (self-billed)' };
};
const invPdf = (o?: any, iv?: any) => V.pdf(iv.title + ' ' + iv.no, ['Mineral Bridge Ltd · 14 Creek Road, Apapa, Lagos · RC 1748201', (o.kind === 'buy' ? 'Bill to: ' : 'Supplier: ') + (iv.cust.business || iv.cust.name) + ', ' + iv.cust.country, 'Order ' + o.id + ' · issued ' + (iv.at ? A.date(iv.at) : A.date(now())) + (iv.due ? ' · due ' + A.date(iv.due) : ''), ''].concat(iv.lines.map((l?: any) => l.name + ' · ' + A.qfmt(l.qty, l.unit) + ' × ' + money(l.unitPrice) + ' = ' + money(l.amount))).concat(iv.extras.map((x?: any) => x[0] + ' ' + money(x[1]))).concat(iv.adj ? ['Price adjustment ' + money(iv.adj)] : []).concat(['Subtotal ' + money(iv.sub), 'Tax ' + iv.rate + '% ' + money(iv.tax), 'TOTAL ' + money(iv.total), 'Status ' + iv.status]));
D.invoice = (c?: any, id?: any) => {
  const db = c.state.db, o = db.orders.find((x?: any) => x.id === id), iv = V.invoiceOf(db, o);
  if (!iv) return { title: 'No invoice yet', sub: o.id + ' · a quotation with a price is needed first', fields: [], sections: [], inputs: [], actions: [{ label: 'Open ' + (o.kind === 'buy' ? 'order' : 'request'), style: V.B[1], go: () => c.openOrder(o.id) }] };
  const acts = [];
  const gen = () => { const r = +V.val(c, 'rate', iv.rate); if (isNaN(r) || r < 0) return c.toast('Enter a valid tax rate'); if (o.live && V.persistInvoice) { V.persistInvoice(c, o, r); c.form = {}; c.commit('Invoice saved for ' + o.id); return; } o.invoice = Object.assign(o.invoice || {}, { no: iv.no, at: now(), rate: r }); A.issueDoc(db, iv.title, iv.no, 'order', o.id, now(), 'issued', V.me(c).name); V.log(c, 'Invoice', iv.no, iv.issued ? 'Invoice regenerated' : 'Invoice generated', '', money(V.invoiceOf(db, o).total)); c.form = {}; c.commit(iv.no + (iv.issued ? ' regenerated' : ' generated')); };
  acts.push(V.act(c, iv.issued ? 'Regenerate invoice' : 'Generate invoice', gen, iv.issued ? 2 : 1, 'finance'));
  if (iv.issued) {
    acts.push({ label: 'Download PDF', style: V.B[1], go: () => { V.download(iv.no + '.pdf', invPdf(o, iv)); V.log(c, 'Invoice', iv.no, 'Downloaded'); c.commit('Downloaded ' + iv.no); } });
    acts.push(V.act(c, 'Send to ' + (o.kind === 'buy' ? 'buyer' : 'seller'), () => { o.invoice.sent = (o.invoice.sent || 0) + 1; V.tell(c, o.cust, iv.title + ' ' + iv.no, o.id); V.log(c, 'Invoice', iv.no, 'Sent to customer'); c.commit(iv.no + ' sent to ' + iv.cust.name); }, 2, 'finance'));
  }
  acts.push({ label: 'Open ' + o.id, style: V.B[2], go: () => c.openOrder(o.id) });
  return { title: iv.title + ' · ' + iv.no, sub: (iv.cust.business || iv.cust.name) + ' · ' + iv.cust.country + ' · ' + o.id, pill: iv.status, pillStyle: V.pill(/Paid/.test(iv.status) ? 'ok' : iv.issued ? 'warn' : 'mute'),
    fields: [kv('Issued', iv.at ? A.fmt(iv.at) : 'Not generated yet'), kv('Due', iv.due ? A.date(iv.due) : ''), kv('Subtotal', money(iv.sub)), kv('Tax (' + iv.rate + '%)', money(iv.tax)), kv('Total', money(iv.total)), kv('Payment', o.kind === 'buy' ? (o.pay ? o.pay.method + ' · ' + o.pay.status + (o.pay.ref ? ' · ' + o.pay.ref : '') : 'Not paid yet') : (o.payout ? (o.payout.ref ? 'Released · ' + o.payout.ref : 'Not released') : 'Not approved yet')), kv('Sent to customer', iv.sent ? iv.sent + ' time' + (iv.sent > 1 ? 's' : '') : 'Not sent')],
    sections: [{ title: 'Lines', items: iv.lines.map((l?: any) => ({ t: l.name, s: A.qfmt(l.qty, l.unit) + ' × ' + money(l.unitPrice), r: money(l.amount) })).concat(iv.extras.map((x?: any) => ({ t: x[0], s: 'Entered on the quotation', r: money(x[1]) }))).concat(iv.adj ? [{ t: 'Price adjustment', s: 'Variation after inspection', r: money(iv.adj) }] : []).concat([{ t: 'Tax ' + iv.rate + '%', r: money(iv.tax) }, { t: 'Total', r: money(iv.total) }]) }],
    inputs: [V.inp(c, 'rate', 'Tax rate (%) — entered by finance', iv.rate)], actions: acts };
};

// ---------- payments: detail panel with confirm / reject ----------
D.payment = (c?: any, id?: any) => {
  const db = c.state.db, o = db.orders.find((x?: any) => x.id === id), p = o.pay, cu = A.cust(db, o.cust), k = curKey(o), acts = [];
  if (!p) return { title: 'No payment', sub: o.id, fields: [], sections: [], inputs: [], actions: [] };
  const waiting = k === 'payOk' && !o.hold;
  if (waiting) {
    const btcShort = p.btc && p.btc.conf < db.settings.btcConfs;
    if (btcShort) acts.push({ label: 'Refresh confirmations (' + p.btc.conf + ' of ' + db.settings.btcConfs + ')', style: V.B[2], go: () => { p.btc.conf++; c.commit(p.btc.conf + ' confirmations'); } });
    else acts.push(V.act(c, 'Confirm payment received', () => { c.form.ref = V.val(c, 'pref', 'TRX-' + A.tail(o.id)); V.advance(c, o); c.form = {}; c.setState({ drawer: { type: 'payment', id: o.id } }); }, 4, 'finance'));
    acts.push(V.act(c, 'Reject payment', () => { const r = V.val(c, 'why', ''); if (!r) return c.toast('Say why — the buyer sees it'); p.failed = (p.failed || []).concat([{ at: now(), reason: r, method: p.method }]); p.status = 'failed'; o.stage = ix(o, 'paid'); o.sAt = now(); o.hist.push({ at: now(), who: V.me(c).name, role: V.me(c).label, text: 'Payment rejected', note: r }); V.log(c, 'Payment', o.id, 'Payment rejected', 'pending', 'failed', r); V.tell(c, o.cust, 'Payment not received — please pay again', o.id); c.form = {}; c.commit('Payment rejected — buyer asked to pay again'); if (o.live && V.persistPaymentReject) V.persistPaymentReject(c, o, r); }, 3, 'finance'));
  }
  acts.push({ label: 'Invoice', style: V.B[2], go: () => c.openDrawer('invoice', o.id) });
  acts.push({ label: 'Open order', style: V.B[2], go: () => c.openOrder(o.id) });
  const st = p.status === 'confirmed' ? 'Confirmed' : p.status === 'failed' ? 'Rejected — awaiting new payment' : 'To confirm';
  return { title: 'Payment · ' + o.id, sub: A.cname(cu) + ' · ' + p.method, pill: st, pillStyle: V.pill(p.status === 'confirmed' ? 'ok' : p.status === 'failed' ? 'err' : 'warn'),
    fields: [kv('Amount', money(p.amount)), kv('Method', p.method), kv('Paid', A.fmt(p.at)), kv('Reference', p.ref), kv('Proof', p.proof ? p.proof + ' · ' + (p.bank || '') : p.upi ? p.upi + ' · ' + p.gateway : p.gateway || p.manual || '')].concat(p.btc ? [kv('Bitcoin', p.btc.amount + ' BTC · ' + p.btc.conf + ' of ' + db.settings.btcConfs + ' confirmations'), kv('Transaction', p.btc.txid)] : []).concat([kv('Attempts', p.attempts), kv('Confirmed', p.confirmedAt ? A.fmt(p.confirmedAt) : ''), kv('Order step', A.nextInfo(o).label)]),
    sections: [{ title: 'Earlier failed attempts', items: (p.failed || []).map((f?: any) => ({ t: f.reason, s: f.method + ' · ' + A.fmt(f.at) })) }],
    inputs: waiting ? [V.inp(c, 'pref', 'Bank or gateway reference', p.ref || 'TRX-' + A.tail(o.id)), V.inp(c, 'why', 'Reason, if rejecting', '', true)] : [], actions: acts };
};

// ---------- lots: sold out ----------
const lot0 = D.lot;
D.lot = (c?: any, id?: any) => {
  const v = lot0(c, id), l = A.lot(c.state.db, id);
  if (l.status === 'listed') v.actions.splice(1, 0, V.act(c, 'Mark sold out', () => V.soldOut(c, l, true), 3, 'catalogue'));
  if (l.status === 'sold out') v.actions.splice(1, 0, V.act(c, 'Mark available again', () => V.soldOut(c, l, false), 4, 'catalogue'));
  if (l.status === 'sold out') v.fields.unshift(kv('Sold out', (l.soldOutNote || 'No stock left') + (l.soldOutAt ? ' · ' + A.fmt(l.soldOutAt) : '')));
  return v;
};
V.soldOut = (c?: any, l?: any, on?: any) => {
  if (on) {
    V.form(c, 'so-' + l.id, { title: 'Mark ' + l.id + ' sold out', sub: l.name + ' · ' + A.qfmt(l.avail, l.unit) + ' still recorded as available', mode: 'Edit', perm: 'catalogue', cta: 'Mark sold out',
      fields: [F('stock', 'Remaining stock', l.avail > 0 ? 'keep' : 'zero', 'choice', [['keep', 'Keep it in stock (hidden from buyers)'], ['zero', 'Set available to 0']], 1), F('note', 'Reason', l.avail > 0 ? 'Fully committed to buyers' : 'All stock sold', 'text', null, 1)],
      save: (x?: any) => { if (l.live && V.persistLot) { c.setState({ drawer: null }); if (x.stock === 'zero' && l.avail > 0 && V.persistStock) V.persistStock(c, l, { type: 'count', qty: 0, note: String(x.note || 'Marked sold out') }); else { l.status = 'sold out'; V.persistLot(c, l); } c.commit(l.id + ' is sold out — buyers see “Sold out” in the app'); return; } const b = l.status; l.status = 'sold out'; l.soldOutAt = now(); l.soldOutNote = x.note; if (x.stock === 'zero' && l.avail > 0) { V.moves(c.state.db).unshift({ at: now(), lot: l.id, delta: -l.avail, type: 'Marked sold out', ref: '', by: V.me(c).name, note: x.note }); l.avail = 0; } V.log(c, 'Lot', l.id, 'Marked sold out', b, 'sold out', x.note); c.setState({ drawer: null }); c.commit(l.id + ' is sold out — buyers see “Sold out” in the app'); } });
  } else {
    if (!(l.avail > 0)) { c.toast('Add stock first — nothing is available to sell'); return V.adjustStock(c, l); }
    l.status = 'listed'; l.soldOutAt = 0; l.soldOutNote = ''; if (l.live && V.persistLot) V.persistLot(c, l); V.log(c, 'Lot', l.id, 'Available again', 'sold out', 'listed'); c.commit(l.id + ' is back on sale');
  }
};
V.rowW = Object.assign(V.rowW || {}, { lots: '240px' });
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- kept as in the design source
V.rowActs.lots = (c?: any, l?: any) => [{ label: 'Edit', go: () => { const v = D.lot(c, l.id); const a = v.actions.find((x?: any) => x.label === 'Edit details'); a ? a.go() : c.openDrawer('lot', l.id); } }, l.status === 'sold out' ? { label: 'Available', go: () => V.can(c, 'catalogue') ? V.soldOut(c, l, false) : c.toast('Needs Catalogue manager') } : { label: 'Sold out', go: () => V.can(c, 'catalogue') ? (l.status === 'listed' ? V.soldOut(c, l, true) : c.toast('Only listed lots can be marked sold out')) : c.toast('Needs Catalogue manager') }, { label: 'Delete', danger: true, go: () => { const v = D.lot(c, l.id); const a = v.actions.find((x?: any) => x.label === 'Delete lot'); a ? a.go() : c.toast('Cannot delete ' + l.id); } }];

// ---------- order detail additions ----------
const od0 = V.orderDetail;
V.orderDetail = (c?: any, o?: any) => {
  const out = od0(c, o), db = c.state.db, k = curKey(o);
  const inspectionType = (type?: any) => type === 'inspection' || type === 'inspection_agency' || type === 'lab' || type === 'lab_assay';
  const logisticsType = (type?: any) => type === 'logistics' || type === 'bonded_carrier';
  const activeOf = (type?: any) => (db.partners || []).filter((p?: any) => p && p.active && (type === 'inspection' ? inspectionType(p.type) : type === 'logistics' ? logisticsType(p.type) : p.type === type));
  const companyLabel = (p?: any) => p.name + (p.modes ? ' · ' + p.modes : p.regions ? ' · ' + p.regions : '');
  const logisticsStep = k === 'assigned' || (o.kind === 'sell' && k === 'picked' && (!o.serverStep || o.serverStep === 'ship'));
  if (logisticsStep && !o.hold && out.next) {
    const parts = activeOf('logistics');
    const assigned = parts.find((p?: any) => o.ship && (p.id === o.ship.partner || p.name === o.ship.partner));
    if (assigned && (c.form.partner == null || c.form.partner === '')) c.form.partner = assigned.id;
    const chosen = parts.find((p?: any) => p.id === c.form.partner);
    out.next.fields = [selectField(c, 'partner', 'Logistics partner *', parts.map((p?: any) => [p.id, companyLabel(p)]))].concat(out.next.fields.filter((f?: any) => !/Logistics partner/.test(f.label)));
    if (!Array.isArray(db.partners)) out.next.note = 'Logistics companies could not be loaded. Refresh the page and try again.';
    else if (!parts.length) out.next.note = 'No active logistics company. Add one, or reactivate a paused company, under Logistics → Partners.';
    else if (chosen) out.next.note = 'Selected company: ' + chosen.name + (assigned && assigned.id === chosen.id ? '. Saved on this request.' : '. Save the assignment before recording pickup.');
    if (!parts.length) out.next.acts = [{ label: 'Add logistics company', style: V.B[2], go: () => V.newPartner(c) }].concat(out.next.acts || []);
    else if (o.live && o.serverStep === 'ship' && V.persistLogisticsAssignment) out.next.acts = (out.next.acts || []).concat([V.act(c, 'Save assignment', () => V.persistLogisticsAssignment(c, o), 2, 'logistics')]);
    out.next.hasFields = true; out.next.hasNote = !!out.next.note;
  }
  if ((k === 'schedule' || k === 'inspect') && !o.hold && out.next) {
    const agencies = activeOf('inspection');
    const inspectors = activeOf('inspector');
    const booked = agencies.find((p?: any) => o.insp && (p.id === o.insp.agency || p.name === o.insp.agency));
    if (booked && (c.form.agency == null || c.form.agency === '')) c.form.agency = booked.id;
    let fields = out.next.fields.filter((f?: any) => !/Inspection agency|On-site result/.test(f.label));
    if (inspectors.length) fields = fields.filter((f?: any) => !/Agency inspector/.test(f.label));
    const choices: any[] = [selectField(c, 'agency', 'Inspection agency *', agencies.map((p?: any) => [p.id, companyLabel(p)]))];
    if (inspectors.length) choices.push(selectField(c, 'inspector', 'Agency inspector', inspectors.map((p?: any) => [p.id, companyLabel(p)])));
    if (k === 'inspect') choices.push(choiceField(c, 'result', 'On-site result *', [['Quantity and condition verified', 'Quantity and condition verified'], ['Quantity differs from declaration', 'Quantity differs from declaration'], ['Condition issue', 'Condition issue']]));
    out.next.fields = choices.concat(fields);
    if (!agencies.length) out.next.note = 'No active inspection company — add or reactivate one under Inspection → Partners.';
    out.next.hasFields = true; out.next.hasNote = !!out.next.note;
  }
  // inspection editing locked once the request is past final approval
  if (o.kind === 'sell' && o.insp && (A.nextInfo(o).done || o.stage > ix(o, 'approved'))) {
    out.manage = (out.manage || []).filter((a?: any) => !/^(Edit inspection|Replace inspection report|Upload inspection report)$/.test(a.label));
  }
  out.manage = out.manage || [];
  // invoice
  const iv = V.invoiceOf(db, o);
  if (iv) {
    out.manage.unshift({ label: iv.issued ? 'Invoice ' + iv.no : 'Generate invoice', style: V.B[iv.issued ? 2 : 1], go: () => c.openDrawer('invoice', o.id) });
    out.cards.push({ title: iv.title + ' · ' + iv.no, rows: [{ k: 'Status', v: iv.status }, { k: 'Subtotal', v: money(iv.sub) }, { k: 'Tax ' + iv.rate + '%', v: money(iv.tax) }, { k: 'Total', v: money(iv.total) }, { k: 'Issued', v: iv.at ? A.fmt(iv.at) : 'Not generated' }], list: [], hasList: false });
  }
  if (o.pay) out.manage.unshift({ label: 'Payment details', style: V.B[2], go: () => c.openDrawer('payment', o.id) });
  // sell: transaction summary + price variation
  if (o.kind === 'sell') {
    const vr = V.variation(o);
    const rows = [{ k: 'Status', v: V.status(o, A.nextInfo(o)) + ' · ' + A.nextInfo(o).label }, { k: 'Declared', v: A.qfmt(o.sell.qty, o.sell.unit) + ' · ' + o.sell.grade }];
    if (o.quotes.length) rows.push({ k: 'Quoted', v: money(vr ? vr.quoted : o.total) + (vr && vr.unit ? ' · ' + money(vr.unit) + ' / ' + o.sell.unit : '') });
    if (o.insp && o.insp.res) rows.push({ k: 'Agency weight', v: A.qfmt(o.insp.res.weight, o.sell.unit) });
    if (o.sgs) rows.push({ k: 'Certified', v: A.qfmt(o.sgs.net, o.sell.unit) + ' · ' + o.sgs.grade + ' · ' + o.sgs.result });
    rows.push({ k: 'Payable to seller', v: o.total ? money(o.total) : 'Not quoted' });
    rows.push({ k: 'Payout', v: o.payout ? (o.payout.ref ? 'Released ' + A.fmt(o.payout.at) + ' · ' + o.payout.ref : 'Approved · not released') : 'Not approved yet' });
    if (o.vault) rows.push({ k: 'Received at vault', v: A.qfmt(o.vault.weight, o.sell.unit) + ' · ' + A.fmt(o.vault.at) });
    if (o.vaultLot) rows.push({ k: 'Stock lot', v: o.vaultLot });
    out.cards.unshift({ title: 'Transaction summary', rows, list: [], hasList: false });
    const inspCard = (out.cards || []).find((card?: any) => card && card.title === 'Third-party inspection');
    if (inspCard && vr && vr.cert != null && (vr.failed || !vr.qtyMatch || !vr.gradeMatch || (o.hold && o.hold.t === 'discrepancy'))) {
      const diff = Number(vr.cert) - Number(vr.declared);
      inspCard.rows = (inspCard.rows || []).concat([
        { k: 'Expected quantity', v: A.qfmt(vr.declared, o.sell.unit) },
        { k: 'Inspected quantity', v: A.qfmt(vr.cert, o.sell.unit) },
        { k: 'Quantity difference', v: (diff > 0 ? '+' : '') + A.qfmt(diff, o.sell.unit) },
      ]);
      if (o.hold && o.hold.t === 'discrepancy') inspCard.rows.push({ k: 'Discrepancy', v: discrepancyState(o.hold.note) === 'rejected' ? 'Rejected' : 'Pending' });
    }
    if (vr && vr.cert != null) {
      const priceTitle = vr.material && !vr.qtyMatch ? ' · ' + pctTxt(vr.pct) : vr.material && !vr.gradeMatch ? ' · grade differs' : vr.failed ? ' · non-compliant' : ' · none';
      const vrows = [{ k: 'Declared quantity', v: A.qfmt(vr.declared, o.sell.unit) }, { k: 'Certified quantity', v: A.qfmt(vr.cert, o.sell.unit) + ' (' + pctTxt(vr.qtyPct) + ')' }, { k: 'Grade declared → certified', v: o.sell.grade + ' → ' + (o.sgs ? o.sgs.grade : 'awaiting report') }, { k: 'Originally quoted', v: money(vr.quoted) }, { k: 'Value at certified quantity', v: money(vr.fair) + ' (' + (vr.diff >= 0 ? '+' : '−') + money(Math.abs(vr.diff)) + ', ' + pctTxt(vr.pct) + ')' }, { k: 'Payable now', v: money(o.total) + (vr.applied ? ' · adjusted' : ' · unchanged') }];
      out.cards.splice(1, 0, { title: 'Price variation' + priceTitle, rows: vrows, hasList: !!(o.variations && o.variations.length), list: (o.variations || []).slice().reverse().map((x?: any) => ({ t: money(x.from) + ' → ' + money(x.to) + ' · ' + x.kind, s: x.note + ' · ' + x.by, r: A.fmt(x.at), go: () => {}, style: 'display:flex; align-items:center; gap:12px; padding:9px 0; border-top:1px solid var(--line2);' })) });
      if (!locked(o)) out.manage.unshift(V.act(c, 'Adjust price for variation', () => V.adjustPrice(c, o), vr.material && !vr.qtyMatch && !vr.applied ? 1 : 2, 'trading'));
      const blocks = approvalBlockers(o, vr);
      if (out.next && !locked(o) && blocks.length && ['approved', 'reportOk', 'payout'].indexOf(k) >= 0) {
        out.next.note = blocks.join(' ');
        out.next.hasNote = true;
        const fix = [];
        if (vr.failed) {
          fix.push(V.act(c, 'Request corrected report', () => V.requestCorrectedReport ? V.requestCorrectedReport(c, o) : c.toast('Corrected-report requests are available on a live order'), 2, 'inspection'));
          fix.push(V.act(c, 'Upload corrected report', () => V.uploadReport(c, o), 1, 'inspection'));
          fix.push(V.act(c, 'Record re-inspection', () => V.recordReinspection ? V.recordReinspection(c, o) : c.toast('Re-inspection is available on a live order'), 2, 'inspection'));
        }
        if (!vr.qtyMatch || !vr.gradeMatch) fix.push(V.act(c, 'Record quantity discrepancy', () => V.markDiscrepancy(c, o), 3, 'ops'));
        if (!fix.length) fix.push(V.act(c, 'Upload corrected report', () => V.uploadReport(c, o), 1, 'inspection'));
        if (k === 'approved' || k === 'payout') out.next.acts = fix;
        else if (o.live) out.next.acts = fix.concat((out.next.acts || []).filter((a?: any) => !/Simulate|Give final approval|Release payment/.test(a.label)));
      } else if (out.next && !locked(o) && o.live && k === 'reportOk') {
        out.next.note = (out.next.note ? out.next.note + ' ' : '') + 'The seller accepts this report in the app. Final approval is available only when the report is compliant and any quantity discrepancy is resolved.';
        out.next.hasNote = true;
      }
    }
  }
  out.hasManage = out.manage.length > 0;
  return out;
};
const ei0 = V.editInsp;
V.editInsp = (c?: any, o?: any) => (A.nextInfo(o).done || o.stage > ix(o, 'approved')) ? c.toast('Inspection is closed — ' + o.id + ' is past final approval') : ei0(c, o);

// ---------- auctions: full status ----------
V.auDetail = (db?: any, a?: any) => {
  const st = V.auSt(a, now()), t = V.top(a);
  if (st === 'Live' && a.closes - now() < A.H) return ['Live · ending soon', 'warn', ''];
  if (st !== 'Closed') return [st, st === 'Live' ? 'ok' : st === 'Upcoming' ? 'info' : st === 'Paused' ? 'warn' : st === 'Cancelled' ? 'err' : 'mute', ''];
  if (!t) return ['Unsold · no bids', 'mute', ''];
  if (a.reserve && t.amt < a.reserve) return ['Unsold · reserve not met', 'err', ''];
  const o = a.orderId && db.orders.find((x?: any) => x.id === a.orderId);
  if (!o) return ['Ended · award pending', 'warn', ''];
  const n = A.nextInfo(o);
  if (n.done) return [o.rejected ? 'Sold · order rejected' : 'Sold · completed', o.rejected ? 'err' : 'ok', n.label];
  return ['Sold · ' + (o.stage <= ix(o, 'paid') ? 'awaiting payment' : o.stage <= ix(o, 'payOk') ? 'payment to confirm' : o.stage < ix(o, 'delivered') ? 'in delivery' : 'delivered'), 'info', n.label];
};
const au0 = D.auction;
D.auction = (c?: any, id?: any) => { const v = au0(c, id), a = c.state.db.auctions.find((x?: any) => x.id === id), d = V.auDetail(c.state.db, a); v.pill = d[0]; v.pillStyle = V.pill(d[1]); v.fields = [kv('Status', d[0] + (d[2] ? ' · next: ' + d[2] : ''))].concat(v.fields || []); return v; };

// ---------- pages ----------
const page0 = V.page;
const empty = (): any => ({ tabs: [], hasTabs: false, chips: [], hasChips: false, table: null, kpis: [], hasKpis: false, minis: [], hasMinis: false, settings: null, isSettings: false, tools: [], hasTools: false });
V.page = (c?: any) => {
  const nav = c.state.nav, db = c.state.db, cu = (id?: any) => A.cust(db, id), N = now();
  if (nav === 'overview') {
    const out = page0(c);
    (out.kpis || []).forEach((k?: any) => { if (/PAYMENTS TO CONFIRM/.test(k.label)) k.go = () => c.go('payments', { tab: Object.assign({}, c.state.tab, { payments: 'Incoming' }), chip: Object.assign({}, c.state.chip, { pay2: 'To confirm' }) }); if (/PAYOUTS TO RELEASE/.test(k.label)) k.go = () => c.go('payments', { tab: Object.assign({}, c.state.tab, { payments: 'Payouts' }), chip: Object.assign({}, c.state.chip, { po2: 'To release' }) }); });
    return out;
  }
  if (nav === 'auctions') {
    const out = empty();
    const det = (a?: any) => V.auDetail(db, a)[0];
    const groups: any = { All: () => true, Live: (a?: any) => /^Live/.test(det(a)), Upcoming: (a?: any) => det(a) === 'Upcoming', Paused: (a?: any) => det(a) === 'Paused', 'Award pending': (a?: any) => /award pending/.test(det(a)), Sold: (a?: any) => /^Sold/.test(det(a)), Unsold: (a?: any) => /^Unsold/.test(det(a)), Cancelled: (a?: any) => det(a) === 'Cancelled' };
    const labels = Object.keys(groups);
    const ch = V.chips(c, 'au2', labels, labels.map(l => db.auctions.filter(groups[l]).length));
    out.chips = ch.list; out.hasChips = true;
    out.tools = [V.act(c, 'New auction', () => c.openDrawer('newAuction', 'new'), 1, 'auction')]; out.hasTools = true;
    const list = db.auctions.filter((a?: any) => groups[ch.cur](a) && V.match(c, [a.id, a.lot, A.lotName(db, a.lot, a.name), det(a), a.orderId]));
    out.table = V.table(c, 'auctions', [['AUCTION', '.7fr', (a?: any) => a.id], ['LOT', '1.5fr'], ['QTY', '.7fr'], ['TOP BID', '1fr', (a?: any) => V.top(a) ? V.top(a).amt : 0], ['BIDS', '.5fr', (a?: any) => Array.isArray(a.bids) ? a.bids.length : 0], ['STATUS', '1.35fr', (a?: any) => det(a)], ['CLOSES', '1fr', (a?: any) => a.closes], ['WINNER · PURCHASE', '1.5fr']], list.sort((x?: any, y?: any) => y.closes - x.closes), (a?: any) => {
      const l = A.lot(db, a.lot), tb = V.top(a), d = V.auDetail(db, a), w = a.winner ? cu(a.winner) : null, s = V.auSt(a, N);
      const name = A.lotName(db, a.lot, a.name || a.lot || a.id), grade = l && l.grade ? l.grade : '', unit = l && l.unit ? l.unit : '';
      return { cells: [{ t: a.id, id: 1 }, { t: name, s: (l ? l.id : (a.lot || '')) + (grade ? ' · ' + grade : '') }, { t: A.qfmt(a.qty, unit) }, { t: tb ? money(tb.amt) : 'No bids', s: 'Start ' + money(a.start) + (a.reserve ? ' · reserve ' + money(a.reserve) : ''), b: !!tb }, { t: Array.isArray(a.bids) ? a.bids.length : 0 }, { t: d[0], pill: d[1] }, { t: s === 'Live' || s === 'Paused' ? A.left(a.closes - N) : A.fmt(a.closes), s: s === 'Upcoming' ? 'Opens ' + A.fmt(a.opens) : s === 'Live' ? 'left' : '' }, { t: w ? A.cname(w) : '—', s: a.orderId ? a.orderId + (d[2] ? ' · ' + d[2] : '') : '' }], go: () => c.openDrawer('auction', a.id) };
    });
    out.hasTable = true; out.hasChipsOrTools = true;
    return out;
  }
  if (nav === 'sell') {
    const out = empty();
    let list = db.orders.filter((o?: any) => o.kind === 'sell');
    const labels = ['All', 'Needs Mineral Bridge', 'Waiting on customer', 'On hold', 'Price varied', 'Payout pending', 'Completed', 'Rejected'];
    const test = (o?: any, l?: any) => l === 'Price varied' ? (() => { const v = V.variation(o); return v && v.cert != null && Math.abs(v.pct) >= 0.5; })() : l === 'Payout pending' ? !!(o.payout && !o.payout.ref) : V.orderChip(o, l);
    const ch = V.chips(c, 'sell2', labels, labels.map(l => list.filter((o?: any) => test(o, l)).length));
    out.chips = ch.list; out.hasChips = true;
    out.tools = [V.act(c, 'New sell request', () => V.newSell ? V.newSell(c) : c.toast('Not available'), 1, 'ops')]; out.hasTools = true;
    list = list.filter((o?: any) => test(o, ch.cur) && V.match(c, [o.id, cu(o.cust).name, cu(o.cust).business, o.sell.name, A.nextInfo(o).label, o.payout && o.payout.ref]));
    out.table = V.table(c, 'sell2', [['REQUEST', '1.15fr', (o?: any) => o.id], ['SELLER', '1.2fr'], ['MATERIAL', '1.35fr'], ['DECLARED → CERTIFIED', '1.2fr'], ['PAYABLE', '.95fr', (o?: any) => o.total || 0], ['PAYOUT', '1fr'], ['STATUS', '1fr', (o?: any) => V.status(o, A.nextInfo(o))], ['NEXT STEP', '1.35fr', (o?: any) => o.stage], ['IN STEP', '.7fr', (o?: any) => o.sAt]], list.sort((a?: any, b?: any) => b.at - a.at), (o?: any) => {
      const n = A.nextInfo(o), vr = V.variation(o), age = N - o.sAt, over = !n.done && n.mb && age > 24 * A.H, st = V.status(o, n);
      const cert = vr && vr.cert != null ? A.qfmt(vr.cert, o.sell.unit) + ' (' + pctTxt(vr.qtyPct) + ')' : 'Not certified';
      return { hl: over, cells: [{ t: o.id, id: 1, s: A.date(o.at) }, { t: A.cname(cu(o.cust)), s: cu(o.cust).country }, { t: o.sell.name, s: o.sell.grade }, { t: A.qfmt(o.sell.qty, o.sell.unit), s: '→ ' + cert, tone: vr && vr.material ? 'warn' : null }, { t: o.total ? money(o.total) : 'Not quoted', b: !!o.total, s: vr && vr.applied ? 'adjusted' : '' }, { t: o.payout ? (o.payout.ref ? 'Released' : 'To release') : '—', s: o.payout && o.payout.ref ? o.payout.ref : '', tone: o.payout && !o.payout.ref ? 'warn' : o.payout ? 'ok' : null }, { t: st, pill: n.done ? (o.rejected ? 'err' : 'ok') : o.hold ? 'warn' : n.mb ? 'gold' : 'mute' }, { t: n.done ? '—' : n.label, s: n.done ? '' : A.OWNER[n.owner] }, { t: n.done ? '—' : A.ago(age), tone: over ? 'err' : null }], go: () => c.openOrder(o.id) };
    });
    out.hasTable = true; out.hasChipsOrTools = true;
    return out;
  }
  if (nav === 'payments') {
    const t = V.tabs(c, 'payments', ['Incoming', 'Payouts', 'Invoices']);
    if (t.cur === 'Payouts') { const out = page0(c); out.tabs = t.list; out.hasTabs = true; const pc = V.chips(c, 'po2', ['All', 'To release', 'Released']); out.chips = pc.list; out.hasChips = true; if (pc.cur !== 'All') { const keep = db.orders.filter((o?: any) => o.payout && (pc.cur === 'Released' ? !!o.payout.ref : !o.payout.ref)); const all = db.orders; db.orders = keep; try { const o2 = page0(c); out.table = o2.table; } finally { db.orders = all; } } out.hasChipsOrTools = true; out.hasTable = !!out.table; return out; }
    const out = empty(); out.tabs = t.list; out.hasTabs = true;
    if (t.cur === 'Invoices') {
      const rows = db.orders.map((o?: any) => ({ o, iv: V.invoiceOf(db, o) })).filter((x?: any) => x.iv);
      const ch = V.chips(c, 'inv2', ['All', 'Not generated', 'Awaiting payment', 'Paid', 'Self-billed']); out.chips = ch.list; out.hasChips = true;
      const test = (x?: any) => ch.cur === 'All' || (ch.cur === 'Not generated' ? !x.iv.issued : ch.cur === 'Self-billed' ? x.o.kind === 'sell' : ch.cur === 'Paid' ? /Paid/.test(x.iv.status) && x.iv.issued : x.iv.status === 'Awaiting payment');
      const list = rows.filter((x?: any) => test(x) && V.match(c, [x.iv.no, x.o.id, cu(x.o.cust).name]));
      out.table = V.table(c, 'inv2', [['INVOICE', '1fr', (x?: any) => x.iv.no], ['TYPE', '1fr'], ['ORDER', '1.15fr', (x?: any) => x.o.id], ['CUSTOMER', '1.3fr'], ['TOTAL', '.9fr', (x?: any) => x.iv.total], ['TAX', '.7fr'], ['STATUS', '1fr', (x?: any) => x.iv.status], ['ISSUED', '.9fr', (x?: any) => x.iv.at || 0]], list, (x?: any) => ({ hl: !x.iv.issued && x.o.pay && x.o.pay.status === 'confirmed', cells: [{ t: x.iv.no, id: 1, mono: 1 }, { t: x.o.kind === 'buy' ? 'Tax invoice' : 'Self-billed' }, { t: x.o.id }, { t: A.cname(cu(x.o.cust)) }, { t: money(x.iv.total), b: 1 }, { t: x.iv.rate + '%', s: money(x.iv.tax) }, { t: x.iv.status, pill: !x.iv.issued ? 'mute' : /Paid/.test(x.iv.status) ? 'ok' : 'warn' }, { t: x.iv.at ? A.fmt(x.iv.at) : '—' }], go: () => c.openDrawer('invoice', x.o.id) }));
      out.hasTable = true; out.hasChipsOrTools = true; return out;
    }
    const labels = ['All', 'To confirm', 'Confirmed', 'Rejected', 'Bank transfer', 'UPI', 'Net banking', 'Bitcoin'];
    const test = (o?: any, l?: any) => l === 'All' || (l === 'To confirm' ? o.pay.status === 'pending' : l === 'Confirmed' ? o.pay.status === 'confirmed' : l === 'Rejected' ? o.pay.status === 'failed' : o.pay.method === l);
    const base = db.orders.filter((o?: any) => o.pay);
    const ch = V.chips(c, 'pay2', labels, labels.map(l => base.filter((o?: any) => test(o, l)).length)); out.chips = ch.list; out.hasChips = true;
    const list = base.filter((o?: any) => test(o, ch.cur) && V.match(c, [o.id, cu(o.cust).name, o.pay.ref, o.pay.method]));
    out.table = V.table(c, 'pay2', [['ORDER', '1.15fr', (o?: any) => o.id], ['BUYER', '1.3fr'], ['METHOD', '.9fr', (o?: any) => o.pay.method], ['AMOUNT', '.95fr', (o?: any) => o.pay.amount], ['DETAIL', '1.5fr'], ['STATUS', '1fr', (o?: any) => o.pay.status], ['PAID', '.9fr', (o?: any) => o.pay.at]], list.sort((a?: any, b?: any) => (a.pay.status === 'pending' ? -1 : 0) - (b.pay.status === 'pending' ? -1 : 0) || b.pay.at - a.pay.at), (o?: any) => { const p = o.pay; return { hl: p.status === 'pending', cells: [{ t: o.id, id: 1, s: o.src !== 'direct' ? 'Auction ' + o.src : '' }, { t: A.cname(cu(o.cust)) }, { t: p.method }, { t: money(p.amount), b: 1 }, { t: p.btc ? p.btc.conf + ' of ' + db.settings.btcConfs + ' confirmations' : p.proof || p.upi || p.bank || p.manual || '—', s: p.ref || p.gateway || '' }, { t: p.status === 'pending' ? 'To confirm' : p.status === 'failed' ? 'Rejected' : 'Confirmed', pill: p.status === 'confirmed' ? 'ok' : p.status === 'failed' ? 'err' : 'warn' }, { t: A.fmt(p.at) }], go: () => c.openDrawer('payment', o.id) }; });
    out.hasTable = true; out.hasChipsOrTools = true;
    return out;
  }
  if (nav === 'inventory') {
    const t = V.tabs(c, 'inventory', ['Stock', 'Buy orders', 'Sell intake']);
    if (t.cur === 'Stock') { const out = page0(c); out.tabs = t.list; out.hasTabs = true; return out; }
    const out = empty(); out.tabs = t.list; out.hasTabs = true;
    if (t.cur === 'Buy orders') {
      const lines: any[] = []; db.orders.filter((o?: any) => o.kind === 'buy').forEach((o?: any) => o.items.forEach((it?: any) => lines.push({ o, it, l: A.lot(db, it.lot) || { name: it.lot, unit: '' } })));
      const ch = V.chips(c, 'invb', ['All', 'Reserved', 'Sold', 'Rejected']); out.chips = ch.list; out.hasChips = true;
      const st = (x?: any) => x.o.rejected ? 'Rejected' : A.nextInfo(x.o).done ? 'Sold' : x.o.stage > 1 ? 'Reserved' : 'Requested';
      const list = lines.filter(x => (ch.cur === 'All' || st(x) === ch.cur) && V.match(c, [x.o.id, x.it.lot, x.l.name, A.cust(db, x.o.cust).name]));
      out.table = V.table(c, 'invb', [['ORDER', '1.15fr', (x?: any) => x.o.id], ['LOT', '1.5fr', (x?: any) => x.it.lot], ['QUANTITY', '.8fr', (x?: any) => x.it.qty], ['VALUE', '.9fr', (x?: any) => x.o.total || 0], ['BUYER', '1.3fr'], ['STOCK EFFECT', '.9fr', (x?: any) => st(x)], ['ORDER STEP', '1.3fr'], ['DATE', '.8fr', (x?: any) => x.o.at]], list.sort((a, b) => b.o.at - a.o.at), (x?: any) => ({ cells: [{ t: x.o.id, id: 1, s: x.o.src !== 'direct' ? 'Auction ' + x.o.src : 'Direct' }, { t: x.l.name, s: x.it.lot }, { t: A.qfmt(x.it.qty, x.l.unit), b: 1 }, { t: x.o.total ? money(x.o.total) : 'Not quoted' }, { t: A.cname(A.cust(db, x.o.cust)) }, { t: st(x), pill: st(x) === 'Sold' ? 'ok' : st(x) === 'Reserved' ? 'warn' : st(x) === 'Rejected' ? 'err' : 'mute' }, { t: A.nextInfo(x.o).label }, { t: A.date(x.o.at) }], go: () => c.openOrder(x.o.id) }));
    } else {
      const list0 = db.orders.filter((o?: any) => o.kind === 'sell');
      const ch = V.chips(c, 'invs', ['All', 'In progress', 'Received at vault', 'Rejected']); out.chips = ch.list; out.hasChips = true;
      const st = (o?: any) => o.rejected ? 'Rejected' : o.vault ? 'Received at vault' : 'In progress';
      const list = list0.filter((o?: any) => (ch.cur === 'All' || st(o) === ch.cur) && V.match(c, [o.id, o.sell.name, A.cust(db, o.cust).name, o.vaultLot]));
      out.table = V.table(c, 'invs', [['REQUEST', '1.15fr', (o?: any) => o.id], ['MATERIAL', '1.4fr'], ['DECLARED', '.8fr', (o?: any) => o.sell.qty], ['CERTIFIED', '.8fr'], ['RECEIVED', '.8fr'], ['PAID', '.9fr', (o?: any) => o.total || 0], ['STOCK LOT', '.8fr'], ['STATUS', '1fr', (o?: any) => st(o)], ['STEP', '1.2fr']], list.sort((a?: any, b?: any) => b.at - a.at), (o?: any) => ({ cells: [{ t: o.id, id: 1, s: A.cname(A.cust(db, o.cust)) }, { t: o.sell.name, s: o.sell.grade }, { t: A.qfmt(o.sell.qty, o.sell.unit) }, { t: o.sgs ? A.qfmt(o.sgs.net, o.sell.unit) : '—', s: o.sgs ? o.sgs.grade : '' }, { t: o.vault ? A.qfmt(o.vault.weight, o.sell.unit) : '—', b: !!o.vault }, { t: o.payout && o.payout.ref ? money(o.payout.amount) : '—', s: o.payout && o.payout.ref ? o.payout.ref : '' }, { t: o.vaultLot || '—', id: !!o.vaultLot }, { t: st(o), pill: st(o) === 'Received at vault' ? 'ok' : st(o) === 'Rejected' ? 'err' : 'info' }, { t: A.nextInfo(o).label }], go: () => c.openOrder(o.id) }));
    }
    out.hasTable = true; out.hasChipsOrTools = true;
    return out;
  }
  return page0(c);
};
const stock0 = D.stock;
D.stock = (c?: any, id?: any) => {
  const v = stock0(c, id), db = c.state.db, l = A.lot(db, id);
  const buys = db.orders.filter((o?: any) => o.kind === 'buy' && o.items.some((x?: any) => x.lot === id));
  const sells = db.orders.filter((o?: any) => o.kind === 'sell' && (o.vaultLot === id || o.sell.mineral === l.mineral));
  v.sections = [{ title: 'Buy orders on this lot · ' + buys.length, items: buys.map((o?: any) => ({ t: o.id + ' · ' + A.cname(A.cust(db, o.cust)), s: A.nextInfo(o).label + (o.total ? ' · ' + money(o.total) : ''), r: A.qfmt(o.items.find((x?: any) => x.lot === id).qty, l.unit), go: () => c.openOrder(o.id) })) }, { title: 'Sell requests · ' + (sells.some((o?: any) => o.vaultLot === id) ? 'source of this lot' : 'same mineral') + ' · ' + sells.length, items: sells.map((o?: any) => ({ t: o.id + ' · ' + o.sell.name, s: A.cname(A.cust(db, o.cust)) + ' · ' + A.nextInfo(o).label, r: A.qfmt(o.vault ? o.vault.weight : o.sell.qty, o.sell.unit), go: () => c.openOrder(o.id) })) }].concat((v.sections || []).filter((s?: any) => !/^Reserved by/.test(s.title)));
  return v;
};
// ---------- new lot: pick subcategory and unit instead of typing keys ----------
const nl0 = D.newLot;
D.newLot = (c?: any) => {
  const v = nl0(c), db = c.state.db;
  const subs: any[] = []; V.cats(db).filter((k?: any) => k.active).forEach((k?: any) => k.subs.filter((s?: any) => s.active).forEach((s?: any) => subs.push([s.id, k.label + ' › ' + s.label])));
  v.inputs = v.inputs.map((i?: any) => /^Subcategory key|^Mineral \(e\.g/.test(i.label) ? choiceField(c, 'mineral', 'Subcategory *', subs, c.form.mineral || 'gold') : /^Unit \(g/.test(i.label) ? choiceField(c, 'unit', 'Unit *', [['g', 'Grams (g)'], ['kg', 'Kilograms (kg)'], ['t', 'Tonnes (t)'], ['ct', 'Carats (ct)']], c.form.unit || 'kg') : i);
  return v;
};
V.v6Ready = true;

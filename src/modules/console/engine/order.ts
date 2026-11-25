/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-order.js. Behaviour and styles are kept as designed.
import { MBA, MBV } from './registry';

const V = MBV;
const VERB: any = { accepted: 'Accept order', quote: 'Issue quotation', confirmed: 'Confirm price', contractMb: 'Countersign e-contract', payOk: 'Confirm payment received', assigned: 'Assign logistics partner', picked: 'Record pickup', transit: 'Record in transit', delivered: 'Record delivery', done: 'Complete', reviewed: 'Mark reviewed', formOk: 'Accept seller details', schedule: 'Book third-party inspection', inspect: 'Record inspection result', sgs: 'Upload inspection report and certificate', approved: 'Give final approval', payout: 'Release payment', received: 'Record vault receipt' };
const T = (id?: any) => id.slice(-5);
function agencyName(c?: any, o?: any) {
  const raw = String((c && c.form && c.form.agency) || (o && o.insp && o.insp.agency) || (o && o.sgs && o.sgs.agency) || '').trim();
  if (!raw || raw === '—' || raw === 'Inspection') return '';
  const partner = (((c && c.state && c.state.db && c.state.db.partners) || []) as any[]).find((p) => p && (p.id === raw || p.name === raw));
  return (String(partner ? partner.name : raw).split('·')[0] || '').trim();
}
function quoteCondition(cond?: any, agency?: any) {
  const name = (String(agency || '').split('·')[0] || '').trim();
  const text = String(cond || '');
  if (!name || name === '—' || name === 'Inspection') return text;
  if (text === 'Subject to Mineral Bridge inspection and SGS test report' || text === 'Subject to Mineral Bridge inspection and a third-party test report') {
    return 'Subject to Mineral Bridge inspection and ' + name + ' test report';
  }
  return text;
}
function sealDefault(name?: any, tail?: any) {
  const code = String(name || 'AGENCY').replace(/[^A-Za-z]/g, '').slice(0, 8).toUpperCase() || 'AGENCY';
  return code + '-SEAL-' + tail + '-01 to 04';
}
function inputs(c?: any, o?: any, key?: any) {
  const db = c.state.db, S = db.settings, t = T(o.id);
  if (key === 'quote') return o.kind === 'buy' ? o.items.map((it?: any, i?: any) => { const l = MBA.lot(db, it.lot) || {}; return ['price' + i, 'Price for ' + MBA.qfmt(it.qty, l.unit) + ' ' + (l.name || it.lot) + ' ($) *', '']; }).concat([['fee', 'Platform fee ($)', ''], ['transport', 'Insured transport ($)', ''], ['other', 'Other charges ($)', ''], ['otherLabel', 'Other charges — what for', ''], ['rate', 'Market rate used today (for the record)', ''], ['valid', 'Valid for (days)', S.buyValidity]]) : [['offer', 'Price offered to seller ($) *', ''], ['deduct', 'Deductions — testing, transport, other ($)', ''], ['deductLabel', 'Deductions — what for', ''], ['rate', 'Market rate used today (for the record)', ''], ['valid', 'Valid for (hours)', S.sellValidity]];
  if (key === 'contractMb') return [['signatory', 'Signatory', 'Tunde Adebayo · Head of Trading']];
  if (key === 'payOk') return [['ref', 'Bank or gateway reference', 'TRX-' + t]];
  if (key === 'assigned') return [['partner', 'Logistics partner', ''], ['sid', 'Shipment ID', 'SSF-' + t]];
  if (key === 'picked' && o.kind === 'sell') return [['partner', 'Logistics partner', ''], ['loc', 'Location', o.ship ? o.ship.from : '']];
  if (key === 'picked' || key === 'transit' || key === 'delivered') return [['loc', 'Location', key === 'transit' ? 'Lagos–Ibadan Expressway' : key === 'delivered' && o.ship ? o.ship.to : (o.ship ? o.ship.from : '')]];
  if (key === 'schedule') return [['agency', 'Inspection agency', ''], ['inspector', 'Agency inspector', ''], ['date', 'Date', o.form ? o.form.slot.date : ''], ['time', 'Time', o.form ? o.form.slot.time : '10:00']];
  if (key === 'inspect') {
    const co = agencyName(c, o) || 'Agency';
    const booked = o.insp && o.insp.agency && o.insp.agency !== 'Inspection' && o.insp.agency !== '—';
    const seal = sealDefault(co, t);
    if (c.form && /SEAL-.*-01 to 04$/.test(String(c.form.seals || '')) && c.form.seals !== seal) c.form.seals = seal;
    const inspector = o.insp && o.insp.inspector && o.insp.inspector !== 'Not recorded' ? o.insp.inspector : '';
    const fields = [['weight', 'Weight recorded by ' + co + ' (' + o.sell.unit + ')', o.sell.qty], ['seals', co + ' seal numbers', seal], ['inspector', 'Agency inspector', inspector], ['result', 'On-site result', ''], ['notes', co + ' inspector notes', '']];
    return booked ? fields : [['agency', 'Inspection agency', '']].concat(fields);
  }
  if (key === 'sgs') return [['no', (agencyName(c, o) || 'Agency') + ' report number', ''], ['grade', 'Certified grade', o.sell.grade.replace('~', '')]];
  if (key === 'payout') return [['ref', 'Payout reference', 'ZB-PO-' + t]];
  if (key === 'received') return [['weight', 'Received weight (' + o.sell.unit + ')', o.sgs ? o.sgs.net : (o.insp && o.insp.res && o.insp.res.weight ? o.insp.res.weight : o.sell.qty)]];
  if (key === 'accepted' || key === 'reviewed') return [['note', 'Reason, if rejecting', '']];
  return [];
}
V.quoteCheck = (o?: any, p?: any) => {
  const num = (v?: any) => v === '' || v == null ? 0 : +v;
  if (['fee', 'transport', 'other', 'deduct'].some(k => p[k] != null && p[k] !== '' && (isNaN(+p[k]) || +p[k] < 0))) return 'Charges must be numbers of 0 or more';
  if (o.kind === 'buy') { for (let i = 0; i < o.items.length; i++) if (!(num(p['price' + i]) > 0)) return 'Enter the price for every line — prices are set manually at today’s market rate'; if (num(p.other) > 0 && !p.otherLabel) return 'Say what the other charges are for'; }
  else { if (!(num(p.offer) > 0)) return 'Enter the price offered to the seller'; if (num(p.deduct) >= num(p.offer)) return 'Deductions cannot be more than the offer'; if (num(p.deduct) > 0 && !p.deductLabel) return 'Say what the deductions are for'; }
  return '';
};
V.advance = (c?: any, o?: any, sim?: any) => {
  const db = c.state.db, S = MBA.stages(o), s = S[o.stage], now = Date.now(), m = V.me(c);
  const p: any = { by: m.name };
  inputs(c, o, s.key).forEach((f?: any) => { p[f[0]] = V.val(c, f[0], f[2]); });
  if (s.key === 'paid' && sim) p.method = 'Bank transfer';
  if (s.key === 'quote') { const e = V.quoteCheck(o, p); if (e) { c.toast(e); return; } }
  if (s.key === 'received' && o.insp && o.insp.res && o.insp.res.weight) { const d = Math.abs(+p.weight - o.insp.res.weight) / o.insp.res.weight * 100; if (d > db.settings.tolerance) { c.toast('Weight differs from inspection by ' + d.toFixed(2) + '% — above the ' + db.settings.tolerance + '% tolerance. Check before recording.'); return; } }
  if (s.key === 'payout' && o.payout && o.payout.amount > db.settings.payoutApprover && o.payout.approvals.length < 2) { c.toast('Payouts above ' + MBA.money(db.settings.payoutApprover) + ' need two finance approvals'); return; }
  MBA.stageData(db, o, s.key, now, p, false);
  o.hist.push({ at: now, who: s.owner === 'cust' ? MBA.cust(db, o.cust).name + ' (simulated)' : m.name, role: s.owner === 'cust' ? 'Customer' : m.label, text: s.label, note: p.note || p.notes || '' });
  V.log(c, o.kind === 'buy' ? 'Order' : 'Sell request', o.id, s.label, S[o.stage - 1] ? S[o.stage - 1].label : '', s.label, sim ? 'Simulated customer action' : '');
  o.stage++; o.sAt = now; c.form = {};
  if (s.owner !== 'cust') V.tell(c, o.cust, s.label, o.id);
  c.commit(sim ? 'Simulated: ' + s.label : s.label + ' · ' + o.id);
};
V.orderDetail = (c?: any, o?: any) => {
  const db = c.state.db, S = MBA.stages(o), PH = o.kind === 'sell' ? MBA.SELL_PH : MBA.BUY_PH, n = MBA.nextInfo(o), cu = MBA.cust(db, o.cust), now = Date.now();
  const cur = o.stage >= S.length ? PH.length : S[o.stage].phase;
  const phases = PH.map((l?: any, i?: any) => {
    const st = n.done && !o.rejected ? 'done' : i < cur ? 'done' : i === cur ? (o.rejected ? 'err' : o.hold ? 'warn' : 'cur') : 'up';
    const col = { done: 'var(--okInk)', cur: 'var(--infoInk)', warn: 'var(--warnInk)', err: 'var(--errInk)', up: 'var(--line)' }[st];
    return { label: l, mark: st === 'done' ? V.svg('check', 12) : String(i + 1), sub: st === 'cur' ? 'Current' : st === 'warn' ? 'On hold' : '',
      dotStyle: 'width:26px; height:26px; flex-shrink:0; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; animation:mbUp .4s ' + (i * 0.05).toFixed(2) + 's backwards ease; ' + (st === 'up' ? 'border:2px solid var(--line); color:var(--ink3); background:var(--card);' : 'background:' + col + '; color:var(--card);'),
      lineStyle: i === PH.length - 1 ? 'display:none;' : 'flex:1; height:2px; margin:0 6px; background:' + (st === 'done' ? 'var(--okInk)' : 'var(--line)') + ';',
      labelStyle: 'font-size:11.5px; font-weight:700; line-height:1.3; color:' + (st === 'up' ? 'var(--ink3)' : 'var(--ink)') + ';' };
  });
  const company = agencyName(c, o);
  const steps = S.map((s?: any, i?: any) => {
    const h = o.hist.slice().reverse().find((x?: any) => x.text === s.label);
    const st = i < o.stage && !o.rejected ? 'done' : i === o.stage && !n.done ? (o.hold ? 'warn' : 'cur') : 'up';
    const stepLabel = s.key === 'inspect' ? (company ? 'Inspection carried out by ' + company : 'Inspection carried out') : s.label;
    const stepOwner = (s.owner === 'sgs' ? (company || 'Agency') + ' (inspector)' : MBA.OWNER[s.owner]) + (s.role ? ' · ' + V.roleLabel(s.role) : '');
    return { label: stepLabel, owner: stepOwner, meta: h ? MBA.fmt(h.at) + ' · ' + h.who : '', note: h && h.note ? h.note : '', hasNote: !!(h && h.note),
      dotStyle: 'width:10px; height:10px; border-radius:6px; flex-shrink:0; margin-top:4px; ' + (st === 'done' ? 'background:var(--okInk);' : st === 'cur' ? 'background:var(--infoInk); box-shadow:0 0 0 4px var(--infoBg);' : st === 'warn' ? 'background:var(--warnInk); box-shadow:0 0 0 4px var(--warnBg);' : 'border:2px solid var(--line);'),
      labelStyle: 'font-size:12.5px; font-weight:' + (st === 'up' ? 600 : 700) + '; color:' + (st === 'up' ? 'var(--ink3)' : 'var(--ink)') + ';' };
  });
  // next action
  // eslint-disable-next-line prefer-const -- kept as in the design source
  const acts = []; let fields = [], note = '', title = n.key === 'inspect' ? (company ? 'Inspection carried out by ' + company : 'Inspection carried out') : n.label, owner = n.done ? '—' : (n.owner === 'sgs' ? (company || 'Agency') + ' (inspector)' : MBA.OWNER[n.owner]);
  if (n.done) { title = o.rejected ? 'Rejected' : o.refundedFull ? 'Refunded in full' : 'Completed'; note = o.rejected ? o.rejected : 'No further steps.'; }
  else if (o.hold) {
    const h = o.hold; note = h.note || '';
    if (h.t === 'declined') { fields = inputs(c, o, 'quote'); acts.push(V.act(c, 'Issue revised quotation', () => { const p: any = { by: V.me(c).name }; inputs(c, o, 'quote').forEach((f?: any) => { p[f[0]] = V.val(c, f[0], f[2]); }); const qe = V.quoteCheck(o, p); if (qe) return c.toast(qe); MBA.stageData(db, o, 'quote', Date.now(), p); o.hold = null; o.sAt = Date.now(); o.hist.push({ at: Date.now(), who: V.me(c).name, role: V.me(c).label, text: 'Revised quotation issued', note: '' }); V.log(c, 'Order', o.id, 'Revised quotation issued', '', MBA.money(o.total)); V.tell(c, o.cust, 'Revised quotation', o.id); c.form = {}; c.commit('Revised quotation sent to ' + cu.name); if (o.live && V.persistOrderHold) V.persistOrderHold(c, o, { clear: true, reason: 'Revised quotation issued · ' + MBA.money(o.total) }); }, 1, 'trading')); }
    if (h.t === 'discrepancy' || h.t === 'clarify') {
      const rejected = h.t === 'discrepancy' && /^\[qty:rejected\]/i.test(String(h.note || ''));
      if (h.t === 'discrepancy') note = (rejected ? 'Discrepancy rejected. ' : 'Discrepancy pending. ') + (h.note || '');
      fields = [['note', h.t === 'clarify' ? 'Reply to seller' : 'Resolution or rejection note', '']];
      acts.push(V.act(c, h.t === 'clarify' ? 'Send clarification' : 'Resolve discrepancy', () => { const r = V.val(c, 'note', ''); if (!r) return c.toast('Add a note first'); const saved = h.t === 'discrepancy' ? 'Discrepancy resolved: ' + r : r; o.hold = null; o.sAt = Date.now(); o.hist.push({ at: Date.now(), who: V.me(c).name, role: V.me(c).label, text: h.t === 'clarify' ? 'Clarification sent' : 'Discrepancy resolved', note: saved }); V.log(c, 'Order', o.id, h.t === 'clarify' ? 'Clarification sent' : 'Discrepancy resolved', '', '', saved); V.tell(c, o.cust, 'Update on ' + o.id, o.id); if (o.live && V.persistOrderHold) V.persistOrderHold(c, o, { clear: true, reason: saved }); c.form = {}; c.commit('Hold cleared on ' + o.id); }, 1, h.t === 'clarify' ? 'inspection' : 'ops'));
      if (h.t === 'discrepancy') acts.push(V.act(c, 'Reject discrepancy', () => { const r = V.val(c, 'note', ''); if (!r) return c.toast('Say why this discrepancy is rejected'); if (o.live && V.persistDiscrepancyReject) return V.persistDiscrepancyReject(c, o, r); o.hold.note = '[qty:rejected] ' + r; o.sAt = Date.now(); o.hist.push({ at: Date.now(), who: V.me(c).name, role: V.me(c).label, text: 'Discrepancy rejected', note: r }); c.form = {}; c.commit('Discrepancy rejected — final approval stays blocked'); }, 3, 'ops'));
    }
    if (h.t === 'refund') acts.push({ label: 'Open refund ' + (h.ref || ''), style: V.B[1], go: () => c.openDrawer('refund', h.ref, 'refunds') });
    if (h.t === 'changes') { acts.push(V.act(c, 'Send reminder', () => { V.tell(c, o.cust, 'Reminder: changes requested', o.id); V.log(c, 'Sell request', o.id, 'Reminder sent'); c.commit('Reminder sent to ' + cu.name); }, 2, 'remind')); acts.push({ label: 'Simulate seller resubmits', style: V.B[2], go: () => { o.hold = null; o.sAt = Date.now(); o.sell.photos += 2; o.hist.push({ at: Date.now(), who: cu.name + ' (simulated)', role: 'Customer', text: 'Changes submitted', note: '2 photos added' }); c.commit('Seller resubmitted'); } }); }
  } else {
    const s = S[o.stage];
    if (s.owner === 'cust') {
      note = 'The customer does this in the app. You can remind them or, for this demo, simulate it.';
      acts.push(V.act(c, 'Send reminder', () => { V.tell(c, o.cust, 'Reminder: ' + s.label, o.id); V.log(c, o.kind === 'buy' ? 'Order' : 'Sell request', o.id, 'Reminder sent', '', '', s.label); c.commit('Reminder sent to ' + cu.name); }, 2, 'remind'));
      acts.push({ label: 'Simulate customer: ' + s.label, style: V.B[2], go: () => V.advance(c, o, true) });
    } else {
      fields = inputs(c, o, s.key);
      let label = s.key === 'inspect' ? 'Record ' + (company || 'agency') + ' inspection result' : s.key === 'sgs' ? 'Upload ' + (company || 'agency') + ' report and certificate' : (VERB[s.key] || s.label), extra = null;
      if (s.key === 'payOk' && o.pay && o.pay.btc && o.pay.btc.conf < db.settings.btcConfs) { note = 'Bitcoin: ' + o.pay.btc.conf + ' of ' + db.settings.btcConfs + ' confirmations.'; acts.push({ label: 'Refresh confirmations', style: V.B[2], go: () => { o.pay.btc.conf++; c.commit(o.pay.btc.conf + ' confirmations'); } }); label = null; }
      if (s.key === 'payout' && o.payout) {
        const P = o.payout, need = P.amount > db.settings.payoutApprover;
        if (need) {
          note = 'Above ' + MBA.money(db.settings.payoutApprover) + ' — two finance approvals needed (' + P.approvals.length + ' of 2): ' + (P.approvals.join(', ') || 'none yet') + '.';
          if (P.approvals.length < 2) { label = null; acts.push(V.act(c, P.approvals.indexOf(V.me(c).name) >= 0 ? 'Waiting on second approver' : 'Approve payout', () => { if (P.approvals.indexOf(V.me(c).name) >= 0) return c.toast('A different finance approver must sign'); if (o.live && P.id && V.persistPayoutApprove) { V.persistPayoutApprove(c, o); return; } P.approvals.push(V.me(c).name); V.log(c, 'Payout', o.id, 'Payout approved', '', P.approvals.length + ' of 2'); c.commit('Approval recorded (' + P.approvals.length + ' of 2)'); }, 1, 'finance')); if (P.approvals.length === 1) extra = { label: 'Simulate second approver', style: V.B[2], go: () => { const other = ['Ngozi Obi', 'Adaeze Okafor'].find(x => P.approvals.indexOf(x) < 0); P.approvals.push(other); c.commit(other + ' approved'); } }; }
        }
      }
      if (label) acts.push(V.act(c, label, () => V.advance(c, o), 1, s.role));
      if (extra) acts.push(extra);
      if (s.key === 'accepted' || s.key === 'reviewed') acts.push(V.act(c, o.kind === 'buy' ? 'Reject order' : 'Decline request', () => { const r = V.val(c, 'note', ''); if (!r) return c.toast('Add a reason — the customer sees it'); o.rejected = r; o.hist.push({ at: Date.now(), who: V.me(c).name, role: V.me(c).label, text: o.kind === 'buy' ? 'Order rejected' : 'Request declined', note: r }); V.log(c, o.kind === 'buy' ? 'Order' : 'Sell request', o.id, 'Rejected', '', '', r); if (o.kind === 'buy') o.items.forEach((it?: any) => { const l = MBA.lot(db, it.lot); if (l) { l.avail += it.qty; if (l.status === 'sold out') l.status = 'listed'; } }); V.tell(c, o.cust, 'Rejected', o.id); c.form = {}; c.commit(o.id + ' rejected'); if (o.live && V.persistReject) V.persistReject(c, o, r); }, 3, 'ops'));
      if (s.key === 'reviewed') acts.push(V.act(c, 'Request changes', () => { const r = V.val(c, 'note', ''); if (!r) return c.toast('Say what needs changing'); o.hold = { t: 'changes', note: r, at: Date.now() }; o.sAt = Date.now(); o.hist.push({ at: Date.now(), who: V.me(c).name, role: V.me(c).label, text: 'Changes requested', note: r }); V.tell(c, o.cust, 'Changes requested', o.id); c.form = {}; c.commit('Changes requested'); if (o.live && V.persistChanges) V.persistChanges(c, o, r); }, 2, 'ops'));
    }
  }
  // cards
  const cards = [], money = MBA.money;
  if (o.kind === 'buy') cards.push({ title: 'Items', rows: o.items.map((i?: any) => { const l = MBA.lot(db, i.lot) || {}; return { k: (l.name || i.lot) + ' · ' + i.lot, v: MBA.qfmt(i.qty, l.unit) + (l.grade ? ' · ' + l.grade : '') + (i.entered ? ' (entered ' + i.entered + ')' : '') }; }).concat([{ k: 'Deliver to', v: o.addr }]) });
  else cards.push({ title: 'Material', rows: [{ k: 'Material', v: o.sell.name }, { k: 'Declared quantity', v: MBA.qfmt(o.sell.qty, o.sell.unit) }, { k: 'Form · grade', v: o.sell.form + ' · ' + o.sell.grade }, { k: 'Photos', v: o.sell.photos + ' (minimum ' + db.settings.minPhotos + ')' }, { k: 'Seller documents', v: o.sell.docs.join(', ') }] });
  const q = o.quotes[o.quotes.length - 1];
  if (q) cards.push({ title: 'Quotation ' + q.no, rows: q.lines.map((l?: any) => ({ k: l.name + ' · ' + MBA.qfmt(l.qty, l.unit), v: money(l.price) })).concat(q.fee ? [{ k: 'Platform fee', v: money(q.fee) }] : []).concat(q.transport ? [{ k: 'Insured transport', v: money(q.transport) }] : []).concat(q.other ? [{ k: 'Other charges' + (q.otherLabel ? ' · ' + q.otherLabel : ''), v: money(q.other) }] : []).concat(q.deduct ? [{ k: 'Deductions' + (q.deductLabel ? ' · ' + q.deductLabel : ''), v: '−' + money(q.deduct) }] : []).concat(q.rate ? [{ k: 'Market rate used', v: q.rate }] : []).concat([{ k: 'Total', v: money(q.total) }, { k: 'Valid until', v: MBA.fmt(q.valid) }, { k: 'Status', v: q.status }]).concat(q.cond ? [{ k: 'Condition', v: quoteCondition(q.cond, company) }] : []), list: o.quotes.slice(0, -1).map((x?: any) => ({ t: x.no, s: x.status, r: money(x.total) })) });
  if (o.contract && o.contract.cust) cards.push({ title: 'E-contract', rows: [{ k: 'Signed by customer', v: o.contract.cust.name + ' · ' + MBA.fmt(o.contract.cust.at) }, { k: 'Device', v: o.contract.cust.device }, { k: 'Countersigned', v: o.contract.mb ? o.contract.mb.name + ' · ' + MBA.fmt(o.contract.mb.at) : 'Pending' }] });
  if (o.pay) { const p = o.pay; cards.push({ title: 'Payment', rows: [{ k: 'Method', v: p.method }, { k: 'Amount', v: money(p.amount) }, { k: 'Status', v: p.status }, { k: 'Reference', v: p.ref || '—' }].concat(p.proof ? [{ k: 'Proof', v: p.proof + ' · ' + p.bank }] : []).concat(p.upi ? [{ k: 'UPI', v: p.upi + ' · ' + p.gateway }] : []).concat(p.btc ? [{ k: 'Bitcoin', v: p.btc.amount + ' BTC at ' + money(p.btc.rate) }, { k: 'Transaction', v: p.btc.txid.slice(0, 18) + '… · ' + p.btc.conf + ' confirmations' }] : []) }); }
  if (o.form) cards.push({ title: 'Seller confirmation form', rows: [{ k: 'Payout', v: o.form.payout.method + ' · ' + o.form.payout.account }, { k: 'Inspection slot', v: o.form.slot.date + ' · ' + o.form.slot.time }, { k: 'Location', v: o.form.slot.location }] });
  if (o.insp) {
    const failed = o.sgs && /non[\s_-]*compliant/i.test(String(o.sgs.result || '')) && !/with remarks/i.test(String(o.sgs.result || ''));
    const history = (o.sgs && o.sgs.history) || [];
    cards.push({ title: 'Third-party inspection', rows: [{ k: 'Agency', v: o.insp.agency || '—' }, { k: 'Inspector', v: o.insp.inspector || 'Not recorded' }, { k: 'Scheduled', v: o.insp.date + ' · ' + o.insp.time }].concat(o.insp.res ? [{ k: 'Weighed', v: MBA.qfmt(o.insp.res.weight, o.sell.unit) }, { k: 'Seals', v: o.insp.res.seals }, { k: 'On-site result', v: (o.insp.res.result || 'Not recorded') + (o.insp.res.notes ? ' · ' + o.insp.res.notes : '') }] : []).concat(o.sgs ? [{ k: 'Report status', v: o.sgs.result || '—' }, { k: 'Report & certificate', v: (o.sgs.agency ? o.sgs.agency + ' · ' : '') + o.sgs.no + ' · ' + o.sgs.grade + ' · ' + o.sgs.result + (o.sgs.remarks ? ' · ' + o.sgs.remarks : '') }].concat(failed ? [{ k: 'Why it failed', v: o.sgs.remarks || ('Report ' + o.sgs.no + ' is non-compliant' + (o.sgs.grade ? ' · grade ' + o.sgs.grade : '')) }] : []) : []), list: history.map((h?: any) => ({ t: 'Previous report ' + (h.no || ''), s: [h.grade, h.result].filter(Boolean).join(' · '), r: h.at ? MBA.fmt(h.at) : '' })) });
  }
  if (o.payout) cards.push({ title: 'Seller payout', rows: [{ k: 'Amount', v: money(o.payout.amount) }, { k: 'To', v: o.payout.method + ' · ' + o.payout.account }, { k: 'Approvals', v: o.payout.approvals.join(', ') || '—' }, { k: 'Reference', v: o.payout.ref ? o.payout.ref + ' · ' + MBA.fmt(o.payout.at) : 'Not released' }] });
  if (o.ship) cards.push({ title: 'Shipment ' + o.ship.id, rows: [{ k: 'Partner', v: o.ship.partner + ' · ' + o.ship.mode + ' · ' + o.ship.scope }, { k: 'Route', v: o.ship.from + ' → ' + o.ship.to }, { k: 'Contact', v: o.ship.contact }], list: o.ship.events.slice().reverse().map((e?: any) => ({ t: e.t, s: e.loc, r: MBA.fmt(e.at) })) });
  if (o.live && o.ship && o.ship.id) { fields.push(['shipLoc', 'Current shipment location', o.ship.to || '']); acts.push(V.act(c, 'Save shipment location', () => { const loc = V.val(c, 'shipLoc', ''); if (!loc) return c.toast('Enter the current location'); o.ship.events.push({ t: 'Location updated', loc, at: Date.now() }); if (V.persistShipment) V.persistShipment(c, o.ship, loc); c.commit('Shipment location saved'); }, 1, 'logistics')); }
  const docs = db.docs.filter((d?: any) => d.eid === o.id || (o.orderId && d.eid === o.orderId) || (o.src !== 'direct' && d.eid === o.src));
  if (docs.length) cards.push({ title: 'Documents', rows: [], list: docs.map((d?: any) => ({ t: d.type + ' · ' + d.no, s: d.status + ' · v' + d.ver, r: MBA.fmt(d.at), go: () => c.openDrawer('doc', d.no) })) });
  const refunds = db.refunds.filter((r?: any) => r.order === o.id);
  if (refunds.length) cards.push({ title: 'Refunds', rows: [], list: refunds.map((r?: any) => ({ t: r.ref + ' · ' + r.reason, s: r.status, r: money(r.amount), go: () => c.openDrawer('refund', r.ref) })) });
  const age = now - o.sAt;
  return {
    id: o.id, kind: o.kind === 'sell' ? 'SELL REQUEST' : (o.src !== 'direct' ? 'AUCTION ORDER · ' + o.src : 'BUY ORDER'), kindStyle: V.pill(o.kind === 'sell' ? 'gold' : 'info'),
    status: V.status(o, n), statusStyle: V.pill(n.tone),
    sub: MBA.cname(cu) + ' · ' + cu.country + ' · created ' + MBA.fmt(o.at), value: o.total ? MBA.money(o.total) : 'Not quoted',
    phases, phaseGrid: 'display:grid; gap:4px; grid-template-columns:repeat(' + PH.length + ', minmax(0,1fr));', steps,
    stepCount: 'Step ' + Math.min(o.stage + 1, S.length) + ' of ' + S.length,
    cards: cards.map(k => ({ title: k.title, rows: k.rows || [], list: (k.list || []).map((x?: any) => ({ t: x.t, s: x.s || '', r: x.r || '', go: x.go || (() => {}), style: 'display:flex; align-items:center; gap:12px; padding:9px 0; border-top:1px solid var(--line2);' + (x.go ? ' cursor:pointer;' : '') })), hasList: !!(k.list && k.list.length) })),
    next: { title, owner, role: n.role ? 'Needs ' + V.roleLabel(n.role) : '', hasRole: !!n.role && !n.done, age: n.done ? '' : 'In this step ' + MBA.ago(age), ageStyle: 'font-size:11.5px; font-weight:700; color:' + (!n.done && n.mb && age > 24 * MBA.H ? 'var(--errInk)' : 'var(--ink3)') + ';', note, hasNote: !!note, toneStyle: V.pill(n.tone), fields: fields.map((f?: any) => V.inp(c, f[0], f[1], f[2], f[0] === 'notes')), hasFields: fields.length > 0, acts, key: o.id + '-' + o.stage + '-' + (o.hold ? o.hold.t : '') + ((n.key === 'inspect' || n.key === 'sgs') ? '-' + company : ''), signedAs: 'Signed in as ' + V.me(c).name + ' · ' + V.me(c).label },
    cust: { name: cu.name, business: cu.business || 'Individual', country: cu.country, contact: cu.email + ' · ' + cu.whatsapp, kyc: cu.kyc, kycStyle: V.pill(cu.kyc === 'approved' ? 'ok' : cu.kyc === 'rejected' ? 'err' : 'warn'), go: () => c.openDrawer('customer', cu.id) }
  };
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-crud.js. Behaviour and styles are kept as designed.
import { MBA, MBV } from './registry';

const V = MBV, D = V.D, A = MBA;
const now = () => Date.now();
const kv = (k?: any, v?: any) => ({ k, v: v == null || v === '' ? '—' : String(v) });
const F = (k?: any, label?: any, def?: any, type?: any, opts?: any, req?: any) => ({ k, label, def: def == null ? '' : def, type: type || 'text', opts: opts || [], req: !!req });
const close = (c?: any) => () => c.setState({ drawer: null });
const nextNo = (ids?: any, prefix?: any, min?: any, pad?: any) => { let m = min; ids.forEach((s?: any) => { if (String(s).indexOf(prefix) === 0) { const n = +String(s).slice(prefix.length); if (n > m) m = n; } }); return prefix + (pad ? String(m + 1).padStart(pad, '0') : m + 1); };
const findCust = (db?: any, s?: any) => { s = String(s || '').trim().toLowerCase(); return db.customers.find((x?: any) => [x.id, x.email, x.name, x.whatsapp].some(v => String(v || '').toLowerCase() === s)); };
const del = (arr?: any, x?: any) => { const i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); };
const danger = (c?: any, label?: any, fn?: any, perm?: any) => V.act(c, label, fn, 3, perm);

// inputs: plain inputs report isChoice:false so the template can branch
const inp0 = V.inp;
// eslint-disable-next-line prefer-spread, prefer-rest-params -- kept as in the design source
V.inp = function (c?: any, k?: any, _label?: any, d?: any) { if (c && c.form && c.form[k] == null && d != null && d !== '') c.form[k] = String(d); return Object.assign(inp0.apply(null, arguments), { isChoice: false, choices: [] }); };

// generic create / edit form
V.form = (c?: any, id?: any, spec?: any) => { c._forms = c._forms || {}; c._forms[id] = spec; c.openDrawer('form', id); };
D.form = (c?: any, id?: any) => {
  const s = (c._forms || {})[id]; if (!s) throw new Error('no form');
  sync(c.state.db);
  const key = (f?: any) => 'f_' + f.k;
  const cur = (f?: any) => c.form[key(f)] != null ? c.form[key(f)] : f.def;
  const inputs = s.fields.map((f?: any) => f.type === 'choice'
    ? { label: f.label + (f.req ? ' *' : ''), isChoice: true, isText: false, isArea: false, value: '', set: () => {}, choices: f.opts.map((o?: any) => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return { label: l, style: V.chip(cur(f) === v), go: (e?: any) => { if (e && e.preventDefault) e.preventDefault(); c.form[key(f)] = v; c.commit(); } }; }) }
    : V.inp(c, key(f), f.label + (f.req ? ' *' : ''), f.def, f.type === 'area'));
  const save = () => {
    const vals: any = {};
    for (const f of s.fields) {
      let v = cur(f);
      if (f.type === 'num') v = String(v).trim() === '' ? NaN : +v; else if (typeof v === 'string') v = v.trim();
      if (f.req && (v === '' || v == null || (f.type === 'num' && isNaN(v)))) return c.toast(f.label + ' is required');
      if (f.type === 'num' && !isNaN(v) && v < 0) return c.toast(f.label + ' cannot be negative');
      vals[f.k] = f.type === 'num' && isNaN(v) ? null : v;
    }
    const err = s.save(vals); if (err) c.toast(err);
  };
  return { title: s.title, sub: s.sub || '', pill: s.mode === 'Edit' ? 'editing' : 'new', pillStyle: V.pill(s.mode === 'Edit' ? 'info' : 'ok'), fields: s.info || [], sections: s.sections || [], inputs, actions: [V.act(c, s.cta, save, 1, s.perm), { label: 'Cancel', style: V.B[2], go: s.back || close(c) }] };
};
// generic delete confirmation
V.delete = (c?: any, id?: any, spec?: any) => { c._forms = c._forms || {}; c._forms[id] = spec; c.openDrawer('del', id); };
D.del = (c?: any, id?: any) => {
  const s = (c._forms || {})[id]; if (!s) throw new Error('no spec');
  const blocked = s.blocked ? s.blocked() : '';
  return { title: s.title, sub: s.sub || '', pill: blocked ? 'cannot delete' : s.verb || 'delete', pillStyle: V.pill(blocked ? 'warn' : 'err'), fields: s.info || [],
    sections: [{ title: blocked ? 'Why it cannot be deleted' : 'What happens', items: (blocked ? [blocked] : s.effects || []).map((t?: any) => ({ t })) }],
    inputs: blocked ? [] : [V.inp(c, 'f_reason', 'Reason, kept in the audit log *', '', true)],
    actions: blocked ? (s.alt ? [s.alt] : []).concat([{ label: 'Back', style: V.B[2], go: s.back || close(c) }])
      : [danger(c, s.cta || 'Delete permanently', () => { const r = (c.form.f_reason || '').trim(); if (!r) return c.toast('Add a reason'); s.run(r); }, s.perm), { label: 'Cancel', style: V.B[2], go: s.back || close(c) }] };
};
const wrap = (name?: any, fn?: any) => { const prev = D[name]; if (!prev) return; D[name] = (c?: any, id?: any) => fn(prev(c, id), c, id); };

// custom roles + renamed roles live in the session data
function sync(db?: any) {
  if (!A._base) A._base = A.ROLES.slice(0, 9);
  const lab = db.roleLabels || {};
  const want = A._base.map((r?: any) => [r[0], lab[r[0]] || r[1], r[2], r[3]]).concat((db.customRoles || []).map((r?: any) => [r[0], r[1], '', '']));
  if (JSON.stringify(want) !== JSON.stringify(A.ROLES)) { A.ROLES.length = 0; want.forEach((r?: any) => A.ROLES.push(r)); }
}
V.syncRoles = sync;

// ---------- orders and sell requests ----------
const stageIx = (o?: any, key?: any) => A.stages(o).findIndex((s?: any) => s.key === key);
function orderForm(c?: any, o?: any) {
  const db = c.state.db, quoted = o.quotes.length > 0;
  if (o.kind === 'buy') {
    const one = o.items.length === 1, it = o.items[0], l = A.lot(db, it.lot) || {};
    const fields = (!quoted && one && !o.rejected ? [F('qty', 'Quantity (' + l.unit + ')', it.qty, 'num', null, 1)] : []).concat(o.stage <= stageIx(o, 'delivered') ? [F('addr', 'Delivery address', o.addr, 'area', null, 1)] : []);
    if (!fields.length) return null;
    return { title: 'Edit ' + o.id, sub: quoted ? 'Quantity is locked once a quotation is issued' : 'Changes are shown to the buyer', mode: 'Edit', perm: 'ops', cta: 'Save changes', back: close(c), fields,
      save: (v?: any) => {
        if (v.qty != null && v.qty !== it.qty) {
          const held = o.stage > 1 && !o.rejected ? it.qty : 0, room = (l.avail || 0) + held;
          if (v.qty < l.min || v.qty > room) return 'Quantity must be ' + A.qfmt(l.min, l.unit) + ' to ' + A.qfmt(room, l.unit);
          if (held) { l.avail = +(room - v.qty).toFixed(3); l.status = l.avail <= 0 ? 'sold out' : l.status === 'sold out' ? 'listed' : l.status; }
          V.log(c, 'Order', o.id, 'Quantity changed', A.qfmt(it.qty, l.unit), A.qfmt(v.qty, l.unit)); it.qty = v.qty; it.entered = A.qfmt(v.qty, l.unit);
        }
        if (v.addr && v.addr !== o.addr) { V.log(c, 'Order', o.id, 'Delivery address changed', o.addr, v.addr); o.addr = v.addr; if (o.ship) o.ship.to = v.addr; }
        V.tell(c, o.cust, 'Order details updated', o.id); c.setState({ drawer: null }); c.commit(o.id + ' updated');
      } };
  }
  if (quoted || o.rejected) return null;
  const s = o.sell;
  return { title: 'Edit ' + o.id, sub: 'Material details can change until a quotation is issued', mode: 'Edit', perm: 'ops', cta: 'Save changes', back: close(c),
    fields: [F('name', 'Material', s.name, 'text', null, 1), F('qty', 'Declared quantity', s.qty, 'num', null, 1), F('unit', 'Unit', s.unit, 'choice', ['g', 'kg', 't', 'ct'], 1), F('form', 'Form', s.form), F('grade', 'Grade', s.grade), F('photos', 'Photos received', s.photos, 'num', null, 1), F('details', 'Details', s.details, 'area')],
    save: (v?: any) => { if (v.photos < db.settings.minPhotos) return 'At least ' + db.settings.minPhotos + ' photos are required'; const before = A.qfmt(s.qty, s.unit) + ' ' + s.name; Object.assign(s, v); V.log(c, 'Sell request', o.id, 'Material details changed', before, A.qfmt(s.qty, s.unit) + ' ' + s.name); c.setState({ drawer: null }); c.commit(o.id + ' updated'); } };
}
function orderDelete(c?: any, o?: any) {
  const db = c.state.db, buy = o.kind === 'buy';
  return { title: 'Delete ' + o.id, sub: (buy ? 'Buy order' : 'Sell request') + ' · ' + A.cname(A.cust(db, o.cust)), perm: 'ops', cta: buy ? 'Delete order' : 'Delete request',
    blocked: () => o.pay ? 'A payment has been recorded on this order. Use a refund instead, so the money trail stays intact.' : o.payout && o.payout.ref ? 'The seller has already been paid. Completed payouts cannot be deleted.' : '',
    alt: o.pay ? { label: 'Create refund request', style: V.B[1], go: () => V.newRefund(c, o.id) } : null,
    effects: ['Removes ' + o.id + ' from all lists; the customer no longer sees it in the app', buy && o.stage > 1 && !o.rejected ? 'Returns the reserved quantity to the lot' : 'No stock is affected', 'Cancels any quotation or contract issued for it', 'The deletion and your reason stay in the audit log'],
    back: close(c),
    run: (r?: any) => {
      if (o.live && db.live && V.persistOrderDelete) { V.persistOrderDelete(c, o, r); return; }
      if (buy && o.stage > 1 && !o.rejected) o.items.forEach((it?: any) => { const l = A.lot(db, it.lot); if (l) { l.avail = +(l.avail + it.qty).toFixed(3); if (l.status === 'sold out' && l.avail > 0) l.status = 'listed'; } });
      db.docs.forEach((d?: any) => { if (d.eid === o.id && d.status !== 'cancelled') { d.status = 'cancelled'; d.reason = 'Record deleted'; } });
      db.auctions.forEach((a?: any) => { if (a.orderId === o.id) a.orderId = null; });
      del(db.orders, o); V.log(c, buy ? 'Order' : 'Sell request', o.id, 'Deleted', '', '', r); V.tell(c, o.cust, (buy ? 'Order ' : 'Sell request ') + 'cancelled by Mineral Bridge', o.id);
      c.setState({ drawer: null, orderId: null }); c.commit(o.id + ' deleted');
    } };
}
V.newBuy = (c?: any) => {
  const db = c.state.db, buyers = db.customers.filter((x?: any) => x.role !== 'seller' && x.kyc === 'approved' && x.status === 'active').map((x?: any) => [x.id, x.name + (x.business ? ' · ' + x.business : '')]);
  const lots = db.lots.filter((l?: any) => l.status === 'listed' && l.avail > 0);
  V.form(c, 'newBuy', { title: 'New buy order', sub: 'Placed on behalf of a verified buyer. It starts at “Order accepted”.', mode: 'New', perm: 'ops', cta: 'Create order',
    fields: [F('cust', 'Buyer (verified only)', buyers[0] && buyers[0][0], 'choice', buyers, 1), F('lot', 'Lot ID', lots[0] && lots[0].id, 'text', null, 1), F('qty', 'Quantity in the lot’s unit', lots[0] && lots[0].min, 'num', null, 1), F('addr', 'Delivery address (blank uses the buyer’s business and country)', '', 'area'), F('note', 'Internal note', '', 'area')],
    sections: [{ title: 'Lots with stock', items: lots.slice(0, 10).map((l?: any) => ({ t: l.id + ' · ' + l.name, s: A.qfmt(l.avail, l.unit) + ' available · minimum ' + A.qfmt(l.min, l.unit) })) }],
    save: (v?: any) => {
      const cu = A.cust(db, v.cust), l = A.lot(db, String(v.lot).toUpperCase());
      if (!l) return 'No lot with ID ' + v.lot; if (l.status !== 'listed') return l.id + ' is ' + l.status;
      if (v.qty < l.min || v.qty > l.avail) return 'Quantity must be ' + A.qfmt(l.min, l.unit) + ' to ' + A.qfmt(l.avail, l.unit);
      if (db.live && V.persistBuy) { V.persistBuy(c, { cust: cu, lot: l, qty: v.qty, addr: v.addr, note: v.note }); return; }
      const id = nextNo(db.orders.map((o?: any) => o.id), 'MB-ORD-26-', 10490), t = now(), m = V.me(c);
      const o = { id, kind: 'buy', src: 'direct', cust: cu.id, items: [{ lot: l.id, qty: v.qty, entered: A.qfmt(v.qty, l.unit) }], stage: 1, at: t, sAt: t, hold: null, rejected: '', quotes: [], hist: [{ at: t, who: m.name, role: m.label, text: 'Order placed', note: 'Placed by Mineral Bridge on behalf of the buyer' + (v.note ? ' · ' + v.note : '') }], refunded: 0, total: 0, addr: v.addr || A.cname(cu) + ', ' + cu.country };
      db.orders.unshift(o); V.log(c, 'Order', id, 'Order created', '', V.itemsText(db, o), v.note); V.tell(c, cu.id, 'Order placed', id);
      c.setState({ drawer: null }); c.commit(id + ' created'); c.openOrder(id);
    } });
};
V.newSell = (c?: any) => {
  const db = c.state.db, sellers = db.customers.filter((x?: any) => x.role !== 'buyer' && x.kyc === 'approved' && x.status === 'active').map((x?: any) => [x.id, x.name + (x.business ? ' · ' + x.business : '')]);
  V.form(c, 'newSell', { title: 'New sell request', sub: 'Submitted on behalf of a verified seller. It starts at “Reviewed by operations”.', mode: 'New', perm: 'ops', cta: 'Create request',
    fields: [F('cust', 'Seller (verified only)', sellers[0] && sellers[0][0], 'choice', sellers, 1), F('name', 'Material', '', 'text', null, 1), F('mineral', 'Mineral key (e.g. gold, copper, lithium)', 'gold', 'text', null, 1), F('qty', 'Declared quantity', '', 'num', null, 1), F('unit', 'Unit', 'kg', 'choice', ['g', 'kg', 't', 'ct'], 1), F('form', 'Form', ''), F('grade', 'Grade (seller’s estimate)', ''), F('photos', 'Photos received', db.settings.minPhotos, 'num', null, 1), F('details', 'Details', '', 'area')],
    save: (v?: any) => {
      if (v.photos < db.settings.minPhotos) return 'At least ' + db.settings.minPhotos + ' photos are required';
      if (db.live && V.persistSell) { V.persistSell(c, { cust: A.cust(db, v.cust), mineral: v.mineral, name: v.name, qty: v.qty, unit: v.unit, form: v.form, grade: v.grade, photos: v.photos, details: v.details }); return; }
      const id = nextNo(db.orders.map((o?: any) => o.id), 'MB-SELL-26-', 20400), t = now(), m = V.me(c);
      const o = { id, kind: 'sell', src: 'direct', cust: v.cust, sell: { mineral: v.mineral.toLowerCase(), name: v.name, qty: v.qty, unit: v.unit, form: v.form, grade: v.grade, photos: v.photos, docs: [], details: v.details || 'Entered by Mineral Bridge.' }, stage: 1, at: t, sAt: t, hold: null, rejected: '', quotes: [], hist: [{ at: t, who: m.name, role: m.label, text: 'Sell request submitted', note: 'Submitted by Mineral Bridge on behalf of the seller' }], total: 0 };
      db.orders.unshift(o); V.log(c, 'Sell request', id, 'Sell request created', '', A.qfmt(v.qty, v.unit) + ' ' + v.name); V.tell(c, v.cust, 'Sell request submitted', id);
      c.setState({ drawer: null }); c.commit(id + ' created'); c.openOrder(id);
    } });
};
const od0 = V.orderDetail;
V.orderDetail = (c?: any, o?: any) => {
  const out = od0(c, o), db = c.state.db, m = [];
  sync(db);
  const ef = orderForm(c, o); if (ef) m.push(V.act(c, o.kind === 'buy' ? 'Edit order details' : 'Edit material details', () => V.form(c, 'ord-' + o.id, ef), 2, 'ops'));
  if (o.insp && !o.insp.res) { const ins = db.partners.filter((p?: any) => p.type === 'inspector' && p.active).map((p?: any) => p.name); m.push(V.act(c, 'Edit inspection', () => V.form(c, 'insp-' + o.id, { title: 'Edit inspection', sub: o.id + ' · not yet carried out', mode: 'Edit', perm: 'inspection', cta: 'Save inspection', fields: [F('inspector', 'Inspector', o.insp.inspector, 'choice', ins.indexOf(o.insp.inspector) < 0 ? [o.insp.inspector].concat(ins) : ins, 1), F('date', 'Date', o.insp.date, 'text', null, 1), F('time', 'Time', o.insp.time, 'text', null, 1), F('location', 'Location', o.insp.location, 'area', null, 1)], save: (v?: any) => { const b = o.insp.inspector + ' · ' + o.insp.date + ' ' + o.insp.time; Object.assign(o.insp, v); V.log(c, 'Sell request', o.id, 'Inspection changed', b, v.inspector + ' · ' + v.date + ' ' + v.time); V.tell(c, o.cust, 'Inspection rescheduled', o.id); c.setState({ drawer: null }); c.commit('Inspection updated'); } }), 2, 'inspection')); }
  if (o.ship && !/Delivered|Received/.test(o.ship.status)) { const lp = db.partners.filter((p?: any) => p.type === 'logistics' && p.active).map((p?: any) => p.name); m.push(V.act(c, 'Edit shipment', () => V.form(c, 'ship-' + o.id, { title: 'Edit shipment ' + o.ship.id, sub: o.ship.status, mode: 'Edit', perm: 'logistics', cta: 'Save shipment', fields: [F('partner', 'Logistics partner', o.ship.partner, 'choice', lp.indexOf(o.ship.partner) < 0 ? [o.ship.partner].concat(lp) : lp, 1), F('mode', 'Mode', o.ship.mode, 'choice', ['Road', 'Rail', 'Sea', 'Air'], 1), F('contact', 'Contact', o.ship.contact, 'text', null, 1), F('from', 'From', o.ship.from, 'area', null, 1), F('to', 'To', o.ship.to, 'area', null, 1)], save: (v?: any) => { const b = o.ship.partner + ' · ' + o.ship.mode; Object.assign(o.ship, v); V.log(c, 'Shipment', o.ship.id, 'Shipment changed', b, v.partner + ' · ' + v.mode); c.setState({ drawer: null }); c.commit('Shipment updated'); } }), 2, 'logistics')); }
  if (o.pay && o.pay.status === 'pending') {
    m.push(V.act(c, 'Edit payment record', () => V.form(c, 'pay-' + o.id, { title: 'Edit payment', sub: o.id + ' · ' + o.pay.method + ' · not yet confirmed', mode: 'Edit', perm: 'finance', cta: 'Save payment', fields: [F('amount', 'Amount received ($)', o.pay.amount, 'num', null, 1), F('ref', 'Bank or gateway reference', o.pay.ref || ''), F('proof', 'Proof of payment file', o.pay.proof || o.pay.manual || '')], save: (v?: any) => { const b = A.money(o.pay.amount); o.pay.amount = v.amount; o.pay.ref = v.ref; if (o.pay.proof != null || v.proof) o.pay.proof = v.proof; V.log(c, 'Payment', o.id, 'Payment record changed', b, A.money(v.amount)); c.setState({ drawer: null }); c.commit('Payment record updated'); } }), 2, 'finance'));
    m.push(danger(c, 'Cancel payment', () => V.delete(c, 'void-' + o.id, { title: 'Cancel payment on ' + o.id, sub: o.pay.method + ' · ' + A.money(o.pay.amount), verb: 'cancel', cta: 'Cancel payment', perm: 'finance', effects: ['Removes this unconfirmed payment and its processing receipt', 'The order goes back to “Payment made” so the buyer can pay again', 'The buyer is notified'], run: (r?: any) => { const t = A.tail(o.id); db.docs.forEach((d?: any) => { if (d.no === 'PR-' + t && d.status !== 'cancelled') { d.status = 'cancelled'; d.reason = r; } }); delete o.pay; o.stage = stageIx(o, 'paid'); o.sAt = now(); o.hist.push({ at: now(), who: V.me(c).name, role: V.me(c).label, text: 'Payment cancelled', note: r }); V.log(c, 'Payment', o.id, 'Payment cancelled', '', '', r); V.tell(c, o.cust, 'Payment not received — please pay again', o.id); c.setState({ drawer: null }); c.commit('Payment cancelled'); } }), 'finance'));
  }
  if (o.payout && !o.payout.ref) m.push(V.act(c, 'Edit payout details', () => V.form(c, 'po-' + o.id, { title: 'Edit seller payout', sub: o.id + ' · ' + A.money(o.payout.amount), mode: 'Edit', perm: 'finance', cta: 'Save payout', fields: [F('method', 'Method', o.payout.method, 'choice', ['Bank transfer', 'Mobile money'], 1), F('account', 'Account', o.payout.account, 'text', null, 1)], save: (v?: any) => { const b = o.payout.account; Object.assign(o.payout, v); if (o.form) o.form.payout = { method: v.method, account: v.account }; V.log(c, 'Payout', o.id, 'Payout account changed', b, v.account); c.setState({ drawer: null }); c.commit('Payout details updated'); } }), 2, 'finance'));
  m.push(danger(c, o.kind === 'buy' ? 'Delete order' : 'Delete request', () => V.delete(c, 'del-' + o.id, orderDelete(c, o)), 'ops'));
  out.manage = m; out.hasManage = m.length > 0;
  return out;
};

// ---------- customers & KYC ----------
const custFields = (x?: any) => {
  x = x || {};
  return [F('name', 'Full name', x.name, 'text', null, 1), F('business', 'Business name (blank for individuals)', x.business), F('email', 'Email', x.email, 'text', null, 1), F('whatsapp', 'WhatsApp number', x.whatsapp, 'text', null, 1), F('country', 'Country', x.country || 'Nigeria', 'text', null, 1),
    F('role', 'Account type', x.role || 'buyer', 'choice', [['buyer', 'Buyer'], ['seller', 'Seller'], ['both', 'Buyer & seller']], 1),
    F('buyerType', 'Buyer type', x.buyerType || '', 'choice', [['', 'None']].concat(Object.keys(A.BT).map(k => [k, A.BT[k]]))),
    F('sellerType', 'Seller type', x.sellerType || '', 'choice', [['', 'None']].concat(Object.keys(A.ST).map(k => [k, A.ST[k]]))),
    F('signin', 'Signs in with', x.signin || 'email', 'choice', [['email', 'Email code'], ['whatsapp', 'WhatsApp code']], 1)];
};
const custCheck = (db?: any, v?: any, self?: any) => {
  if (v.email.indexOf('@') < 0) return 'Enter a valid email';
  if (db.customers.some((x?: any) => x !== self && x.email.toLowerCase() === v.email.toLowerCase())) return 'Another customer already uses that email';
  if (v.role !== 'seller' && !v.buyerType) return 'Pick a buyer type';
  if (v.role !== 'buyer' && !v.sellerType) return 'Pick a seller type';
  if (v.role === 'buyer') v.sellerType = ''; if (v.role === 'seller') v.buyerType = '';
  return '';
};
V.newCustomer = (c?: any) => { const db = c.state.db; V.form(c, 'newCust', { title: 'New customer', sub: 'Created as active. They still need to pass KYC before trading.', mode: 'New', perm: 'kyc', cta: 'Create customer', fields: custFields(), save: (v?: any) => { const e = custCheck(db, v); if (e) return e; if (db.live && V.persistCustomerCreate) { V.persistCustomerCreate(c, v); return; } const id = nextNo(db.customers.map((x?: any) => x.id), 'C-', 3000); const x = Object.assign({ id, kyc: 'not started', kycRef: '', status: 'active', joined: now(), suspendReason: '', prefs: { email: true, sms: false, whatsapp: v.signin === 'whatsapp', push: true } }, v); db.customers.unshift(x); V.log(c, 'Customer', id, 'Customer created', '', x.name); c.setState({ drawer: null }); c.commit(x.name + ' created'); c.openDrawer('customer', id); } }); };
V.newKyc = (c?: any, custId?: any) => {
  const db = c.state.db, todo = db.customers.filter((x?: any) => !x.kycRef).map((x?: any) => [x.id, x.name + (x.business ? ' · ' + x.business : '')]);
  if (!todo.length) return c.toast('Every customer already has a KYC submission');
  V.form(c, 'newKyc', { title: 'New KYC submission', sub: 'Records documents received outside the app, for example by email.', mode: 'New', perm: 'kyc', cta: 'Create submission',
    fields: [F('cust', 'Customer', custId || todo[0][0], 'choice', todo, 1), F('idType', 'ID type', 'National ID', 'choice', ['Passport', 'National ID', 'Driving licence'], 1)],
    save: (v?: any) => {
      const cu = A.cust(db, v.cust), biz = !(A.NO_BIZ.indexOf(cu.buyerType) >= 0 || A.NO_BIZ.indexOf(cu.sellerType) >= 0);
      const docs = (v.idType === 'Passport' ? [['passport', 'Passport photo page']] : [['idFront', v.idType + ' · front'], ['idBack', v.idType + ' · back']]).concat([['selfie', 'Selfie holding ID'], ['address', 'Proof of address']]).concat(biz ? [['business', cu.role === 'seller' ? 'Mining or dealer licence / registration' : 'Business registration certificate']] : []);
      const ref = nextNo(db.kyc.map((k?: any) => k.ref), 'MB-KYC-26-', 3100);
      db.kyc.unshift({ ref, cust: cu.id, idType: v.idType, biz, at: now(), status: 'pending', docs: docs.map(d => ({ kind: d[0], label: d[1], status: 'submitted', note: '' })), reason: '', reviewedBy: '' });
      cu.kyc = 'pending'; cu.kycRef = ref; V.log(c, 'KYC', ref, 'KYC submission created', '', cu.name);
      c.setState({ drawer: null }); c.commit(ref + ' added to the KYC queue'); c.openDrawer('kyc', ref);
    } });
};
wrap('customer', (v?: any, c?: any, id?: any) => {
  const db = c.state.db, x = A.cust(db, id);
  if (!x.kycRef) { v.actions = v.actions.filter((a?: any) => a.label.indexOf('Open KYC') !== 0); v.actions.unshift(V.act(c, 'Create KYC submission', () => V.newKyc(c, x.id), 1, 'kyc')); v.fields = v.fields.map((f?: any) => f.k === 'KYC' ? kv('KYC', x.kyc) : f); }
  v.actions.push(V.act(c, 'Edit details', () => V.form(c, 'cust-' + x.id, { title: 'Edit ' + x.name, sub: x.id, mode: 'Edit', perm: 'kyc', cta: 'Save customer', back: () => c.openDrawer('customer', x.id), fields: custFields(x), save: (val?: any) => { const e = custCheck(db, val, x); if (e) return e; if (db.live && x.userId && V.persistCustomerUpdate) { V.persistCustomerUpdate(c, x, { name: val.name, business: val.business, country: val.country }); return; } const b = x.name + ' · ' + x.email; Object.assign(x, val); if (val.signin === 'whatsapp') x.prefs.whatsapp = true; V.log(c, 'Customer', x.id, 'Customer edited', b, x.name + ' · ' + x.email); c.commit(x.name + ' saved'); c.openDrawer('customer', x.id); } }), 2, 'kyc'));
  v.actions.push(danger(c, 'Delete customer', () => V.delete(c, 'dc-' + x.id, { title: 'Delete ' + x.name, sub: x.id + ' · ' + (x.business || 'Individual'), perm: 'suspend', back: () => c.openDrawer('customer', x.id),
    blocked: () => { const n = db.orders.filter((o?: any) => o.cust === x.id).length + db.refunds.filter((r?: any) => r.cust === x.id).length + db.threads.filter((t?: any) => t.cust === x.id).length; return n ? x.name + ' has ' + n + ' orders, refunds or conversations. Records with history cannot be deleted — suspend the account instead.' : ''; },
    alt: { label: 'Back to suspend', style: V.B[1], go: () => c.openDrawer('customer', x.id) },
    effects: ['Removes the account and its KYC submission', 'They can no longer sign in to the app', 'Notification history for them is removed'],
    run: (r?: any) => { db.kyc = db.kyc.filter((k?: any) => k.cust !== x.id); db.deliveries = db.deliveries.filter((d?: any) => d.cust !== x.id); del(db.customers, x); V.log(c, 'Customer', x.id, 'Customer deleted', '', '', r); c.setState({ drawer: null }); c.commit(x.name + ' deleted'); } }), 'suspend'));
  return v;
});
wrap('kyc', (v?: any, c?: any, ref?: any) => {
  const db = c.state.db, k = db.kyc.find((x?: any) => x.ref === ref), cu = A.cust(db, k.cust);
  v.actions.push(danger(c, 'Delete submission', () => V.delete(c, 'dk-' + ref, { title: 'Delete ' + ref, sub: cu.name, perm: 'kyc', back: () => c.openDrawer('kyc', ref), effects: ['Removes this submission and its documents', cu.name + ' goes back to “KYC not started” and must submit again before trading', 'They are notified'], run: (r?: any) => { del(db.kyc, k); cu.kyc = 'not started'; cu.kycRef = ''; V.log(c, 'KYC', ref, 'Submission deleted', '', '', r); V.tell(c, cu.id, 'Please submit your identity documents again', ref); c.setState({ drawer: null }); c.commit(ref + ' deleted'); } }), 'kyc'));
  return v;
});

// ---------- auctions ----------
wrap('auction', (v?: any, c?: any, id?: any) => {
  const db = c.state.db, a = db.auctions.find((x?: any) => x.id === id), st = V.auSt(a, now()), l = A.lot(db, a.lot);
  if (!a.bids.length && (st === 'Upcoming' || st === 'Paused')) v.actions.push(V.act(c, 'Edit auction', () => V.form(c, 'au-' + id, { title: 'Edit ' + id, sub: l.name + ' · no bids yet', mode: 'Edit', perm: 'auction', cta: 'Save auction', back: () => c.openDrawer('auction', id),
    fields: [F('qty', 'Quantity (' + l.unit + ')', a.qty, 'num', null, 1), F('start', 'Starting bid ($)', a.start, 'num', null, 1), F('step', 'Bid step ($)', a.step, 'num', null, 1)].concat(st === 'Upcoming' ? [F('opens', 'Opens in (hours from now)', Math.max(0, Math.round((a.opens - now()) / A.H)), 'num', null, 1)] : []).concat([F('dur', 'Runs for (hours after opening)', Math.round((a.closes - Math.max(a.opens, now())) / A.H), 'num', null, 1)]),
    save: (x?: any) => { if (x.qty <= 0 || x.qty > l.avail) return 'Quantity must be up to ' + A.qfmt(l.avail, l.unit); if (x.start <= 0 || x.step <= 0) return 'Starting bid and step must be above zero'; if (x.dur < 1) return 'Run for at least 1 hour'; const b = A.money(a.start) + ' · ' + a.qty; a.qty = x.qty; a.start = x.start; a.step = x.step; if (x.opens != null) a.opens = now() + x.opens * A.H; a.closes = Math.max(a.opens, now()) + x.dur * A.H; V.log(c, 'Auction', id, 'Auction edited', b, A.money(a.start) + ' · ' + a.qty); c.commit(id + ' saved'); c.openDrawer('auction', id); } }), 2, 'auction'));
  v.actions.push(danger(c, 'Delete auction', () => V.delete(c, 'da-' + id, { title: 'Delete ' + id, sub: l.name, perm: 'auction', back: () => c.openDrawer('auction', id),
    blocked: () => a.orderId ? 'A winner order (' + a.orderId + ') was created from this auction.' : a.bids.length ? 'This auction has ' + a.bids.length + ' bids. Cancel it instead so bidders are told why.' : '',
    effects: ['Removes the auction from the app', 'Reminder subscribers are not notified', 'The lot keeps its stock'], run: (r?: any) => { if (db.live && V.persistAuctionDelete) { V.persistAuctionDelete(c, id); return; } del(db.auctions, a); V.log(c, 'Auction', id, 'Auction deleted', '', '', r); c.setState({ drawer: null }); c.commit(id + ' deleted'); } }), 'auction'));
  return v;
});

// ---------- catalogue lots ----------
wrap('lot', (v?: any, c?: any, id?: any) => {
  const db = c.state.db, l = A.lot(db, id); if (!l) return v;
  v.actions.push(V.act(c, 'Edit details', () => V.form(c, 'lot-' + id, { title: 'Edit ' + l.id, sub: l.name, mode: 'Edit', perm: 'catalogue', cta: 'Save lot', back: () => c.openDrawer('lot', id),
    fields: [F('name', 'Name', l.name, 'text', null, 1), F('form', 'Form', l.form), F('grade', 'Grade', l.grade), F('origin', 'Origin', l.origin), F('lab', 'Testing lab', l.lab), F('cert', 'Test report number', l.cert)],
    save: (x?: any) => { const b = l.name + ' · ' + (l.grade || '—'); Object.assign(l, x); V.log(c, 'Lot', l.id, 'Lot details edited', b, l.name + ' · ' + (l.grade || '—')); if (l.live && V.persistLot) V.persistLot(c, l); c.commit(l.id + ' saved'); c.openDrawer('lot', id); } }), 2, 'catalogue'));
  v.actions.push(danger(c, 'Delete lot', () => V.delete(c, 'dl-' + id, { title: 'Delete ' + l.id, sub: l.name, perm: 'catalogue', back: () => c.openDrawer('lot', id),
    blocked: () => { const o = db.orders.filter((x?: any) => x.items && x.items.some((i?: any) => i.lot === l.id)).length, au = db.auctions.filter((x?: any) => x.lot === l.id).length; return o || au ? l.id + ' is used by ' + o + ' orders and ' + au + ' auctions. Archive it instead so their history stays intact.' : ''; },
    alt: l.status !== 'archived' ? V.act(c, 'Archive instead', () => { l.status = 'archived'; V.log(c, 'Lot', l.id, 'Archived'); c.commit(l.id + ' archived'); c.openDrawer('lot', id); }, 1, 'catalogue') : null,
    effects: ['Removes the lot, its images and documents from the catalogue', 'Buyers can no longer find it in the app'], run: (r?: any) => { if (db.live && V.persistLotDelete) { V.persistLotDelete(c, l); return; } del(db.lots, l); V.log(c, 'Lot', l.id, 'Lot deleted', '', '', r); c.setState({ drawer: null }); c.commit(l.id + ' deleted'); } }), 'catalogue'));
  return v;
});

// ---------- refunds ----------
const REASONS = ['No longer needed', 'Delivery delayed', 'Paid twice', 'Quantity or quality issue', 'Damaged in transit', 'Other'];
V.newRefund = (c?: any, orderId?: any) => {
  const db = c.state.db;
  V.form(c, 'newRf', { title: 'New refund request', sub: 'Raised on behalf of a buyer, for example after a phone call.', mode: 'New', perm: 'finance', cta: 'Create refund request',
    fields: [F('order', 'Order ID', orderId || '', 'text', null, 1), F('type', 'Type', 'partial', 'choice', [['partial', 'Partial'], ['full', 'Full — cancels the order']], 1), F('amount', 'Amount for a partial refund ($)', '', 'num'), F('reason', 'Reason', REASONS[0], 'choice', REASONS, 1), F('note', 'What happened', '', 'area', null, 1), F('dest', 'Refund to', 'original', 'choice', [['original', 'Original payment method'], ['bank', 'Bank account']], 1), F('bank', 'Bank, account and SWIFT (bank refunds only)', '')],
    save: (v?: any) => {
      const o = db.orders.find((x?: any) => x.id === String(v.order).toUpperCase().trim());
      if (!o) return 'No order with that ID'; if (!o.pay) return o.id + ' has no payment to refund';
      if (db.refunds.some((r?: any) => r.order === o.id && ['requested', 'review', 'approved', 'processing'].indexOf(r.status) >= 0)) return o.id + ' already has an open refund';
      const paid = o.pay.amount - (o.refunded || 0), amt = v.type === 'full' ? paid : v.amount;
      if (!(amt > 0) || amt > paid) return 'Amount must be between $1 and ' + A.money(paid);
      if (v.dest === 'bank' && !v.bank) return 'Add the bank details';
      if (db.live && V.persistRefundCreate) { V.persistRefundCreate(c, { order: o, type: v.type, amount: amt, reason: v.reason, note: v.note, dest: v.dest, bank: v.bank }); return; }
      const ref = nextNo(db.refunds.map((r?: any) => r.ref), 'MB-RF-26-', 41, 4), t = now();
      const r = { ref, order: o.id, cust: o.cust, type: v.type, amount: amt, reason: v.reason, note: v.note, dest: v.dest === 'bank' ? { method: 'bank', bank: v.bank.split(',')[0], account: v.bank, code: '' } : { method: 'original' }, evidence: [], status: 'requested', at: t, sAt: t, declineReason: '', bankRef: '', approvals: [], method: o.pay.method };
      db.refunds.unshift(r); if (!A.nextInfo(o).done) { o.hold = { t: 'refund', ref, note: v.reason + ' · ' + A.money(amt), at: t }; o.sAt = t; }
      V.log(c, 'Refund', ref, 'Refund request created', '', A.money(amt), v.reason); V.tell(c, o.cust, 'Refund request received', ref);
      c.setState({ drawer: null }); c.commit(ref + ' created'); c.openDrawer('refund', ref);
    } });
};
wrap('refund', (v?: any, c?: any, ref?: any) => {
  const db = c.state.db, r = db.refunds.find((x?: any) => x.ref === ref), o = db.orders.find((x?: any) => x.id === r.order);
  if (r.status === 'requested' || r.status === 'review') v.actions.push(V.act(c, 'Edit request', () => V.form(c, 'rf-' + ref, { title: 'Edit ' + ref, sub: r.order, mode: 'Edit', perm: 'finance', cta: 'Save refund', back: () => c.openDrawer('refund', ref),
    fields: (r.type === 'partial' ? [F('amount', 'Amount ($)', r.amount, 'num', null, 1)] : []).concat([F('reason', 'Reason', REASONS.indexOf(r.reason) >= 0 ? r.reason : 'Other', 'choice', REASONS, 1), F('note', 'What happened', r.note, 'area', null, 1)]),
    save: (x?: any) => { if (x.amount != null) { const max = o && o.pay ? o.pay.amount - (o.refunded || 0) : x.amount; if (!(x.amount > 0) || x.amount > max) return 'Amount must be between $1 and ' + A.money(max); } if (r.live && V.persistRefundEdit) { V.persistRefundEdit(c, r, x); return; } const b = A.money(r.amount) + ' · ' + r.reason; Object.assign(r, x); if (o && o.hold && o.hold.ref === ref) o.hold.note = r.reason + ' · ' + A.money(r.amount); V.log(c, 'Refund', ref, 'Refund edited', b, A.money(r.amount) + ' · ' + r.reason); c.commit(ref + ' saved'); c.openDrawer('refund', ref); } }), 2, 'finance'));
  v.actions.push(danger(c, 'Delete request', () => V.delete(c, 'dr-' + ref, { title: 'Delete ' + ref, sub: r.order + ' · ' + A.money(r.amount), perm: 'finance', back: () => c.openDrawer('refund', ref),
    blocked: () => ['approved', 'processing', 'refunded'].indexOf(r.status) >= 0 ? 'This refund is ' + r.status + '. Approved and paid refunds stay on record.' : '',
    effects: ['Removes the request', 'If the order was on hold for this refund, it continues from where it stopped'], run: (x?: any) => { if (o && o.hold && o.hold.ref === ref) { o.hold = null; o.sAt = now(); } del(db.refunds, r); V.log(c, 'Refund', ref, 'Refund request deleted', '', '', x); c.setState({ drawer: null }); c.commit(ref + ' deleted'); } }), 'finance'));
  return v;
});

// ---------- documents & templates ----------
V.newDoc = (c?: any) => {
  const db = c.state.db;
  if (db.live) {
    V.form(c, 'newDoc', {
      title: 'New document',
      sub: 'Uploads a file and issues it against an order. The number is assigned by the server.',
      mode: 'New',
      perm: 'ops',
      cta: 'Choose file and upload',
      fields: [
        F('type', 'Document type', 'Consignment note', 'text', null, 1),
        F('eid', 'Order reference', '', 'text', null, 1),
      ],
      save: (v?: any) => {
        const known = db.orders.some((o?: any) => o.id === v.eid);
        if (!known) return 'No order with ID ' + v.eid;
        if (!V.persistNewDocument) return 'Upload is not available';
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,image/png,image/jpeg,image/webp';
        input.onchange = () => {
          const file = input.files && input.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const raw = String(reader.result || '');
            const base64 = raw.slice(raw.indexOf(',') + 1);
            V.persistNewDocument(c, {
              type: v.type,
              eid: v.eid,
              filename: file.name,
              contentType: file.type || 'application/pdf',
              base64,
            });
            c.setState({ drawer: null });
            c.commit('Uploading document for ' + v.eid);
          };
          reader.readAsDataURL(file);
        };
        input.click();
      },
    });
    return;
  }
  V.form(c, 'newDoc', { title: 'New document', sub: 'Registers a document issued outside the console, for example a signed paper copy.', mode: 'New', perm: 'ops', cta: 'Register document', fields: [F('type', 'Document type', 'Consignment note', 'text', null, 1), F('no', 'Number', '', 'text', null, 1), F('eid', 'Linked record (order, request, auction or refund ID)', '', 'text', null, 1)], save: (v?: any) => { if (db.docs.some((d?: any) => d.no === v.no && d.status !== 'cancelled')) return 'A document with that number already exists'; const known = db.orders.some((o?: any) => o.id === v.eid) || db.auctions.some((a?: any) => a.id === v.eid) || db.refunds.some((r?: any) => r.ref === v.eid); if (!known) return 'No record with ID ' + v.eid; db.docs.unshift({ no: v.no, type: v.type, entity: 'manual', eid: v.eid, ver: 1, status: 'issued', at: now(), by: V.me(c).name, reason: '', manual: true }); V.log(c, 'Document', v.no, 'Document registered', '', v.type); c.setState({ drawer: null }); c.commit(v.no + ' registered'); c.openDrawer('doc', v.no); } });
};
wrap('doc', (v?: any, c?: any, no?: any) => {
  const db = c.state.db, d = db.docs.find((x?: any) => x.no === no);
  if (d.manual && d.status === 'issued') v.actions.push(V.act(c, 'Edit document', () => V.form(c, 'doc-' + no, { title: 'Edit ' + no, sub: d.type, mode: 'Edit', perm: 'ops', cta: 'Save document', back: () => c.openDrawer('doc', no), fields: [F('type', 'Document type', d.type, 'text', null, 1), F('eid', 'Linked record', d.eid, 'text', null, 1)], save: (x?: any) => { const b = d.type + ' · ' + d.eid; Object.assign(d, x); V.log(c, 'Document', no, 'Document edited', b, d.type + ' · ' + d.eid); c.commit(no + ' saved'); c.openDrawer('doc', no); } }), 2, 'ops'));
  v.actions.push(danger(c, 'Delete document', () => V.delete(c, 'dd-' + no, { title: 'Delete ' + no, sub: d.type + ' · v' + d.ver, perm: 'ops', back: () => c.openDrawer('doc', no),
    blocked: () => !d.manual && d.status === 'issued' ? 'This is a live system document. Cancel it first, then it can be deleted.' : '',
    effects: ['Removes this version from the register', 'The customer no longer sees it in the app'], run: (r?: any) => { del(db.docs, d); V.log(c, 'Document', no, 'Document deleted', '', '', r); c.setState({ drawer: null }); c.commit(no + ' deleted'); } }), 'ops'));
  return v;
});
V.newTpl = (c?: any) => { const db = c.state.db; V.form(c, 'newTpl', { title: 'New template', sub: 'Use the same placeholders as the other templates.', mode: 'New', perm: 'settings', cta: 'Create template', fields: [F('name', 'Template name', '', 'text', null, 1), F('body', 'Body', 'MINERAL BRIDGE LTD · 14 Creek Road, Apapa, Lagos\n\n{{number}} · {{issue_date}}\n\n{{customer_name}} ({{customer_business}})\n\n{{line_items}}\n\nSigned for Mineral Bridge Ltd: {{signatory}}', 'area', null, 1)], save: (v?: any) => { if (db.dtpl.some((t?: any) => t.name.toLowerCase() === v.name.toLowerCase())) return 'A template with that name exists'; if (db.live && V.persistTemplate) { V.persistTemplate(c, { name: v.name, body: v.body }); c.setState({ drawer: null }); c.commit(v.name + ' saved'); return; } const id = nextNo(db.dtpl.map((t?: any) => t.id), 'TPL-', 0); db.dtpl.push({ id, name: v.name, ver: 1, updated: now(), body: v.body }); V.log(c, 'Template', v.name, 'Template created'); c.setState({ drawer: null }); c.commit(v.name + ' created'); c.openDrawer('tpl', id); } }); };
wrap('tpl', (v?: any, c?: any, id?: any) => {
  const db = c.state.db, t = db.dtpl.find((x?: any) => x.id === id);
  v.actions.push(V.act(c, 'Rename', () => V.form(c, 'tpln-' + id, { title: 'Rename template', sub: t.name, mode: 'Edit', perm: 'settings', cta: 'Save name', back: () => c.openDrawer('tpl', id), fields: [F('name', 'Template name', t.name, 'text', null, 1)], save: (x?: any) => { if (db.live && V.persistTemplate) { V.persistTemplate(c, { id: t.id, name: x.name, body: t.body }); c.commit('Renamed'); c.openDrawer('tpl', id); return; } const b = t.name; t.name = x.name; V.log(c, 'Template', x.name, 'Template renamed', b, x.name); c.commit('Renamed'); c.openDrawer('tpl', id); } }), 2, 'settings'));
  v.actions.push(danger(c, 'Delete template', () => V.delete(c, 'dt-' + id, { title: 'Delete ' + t.name, sub: 'v' + t.ver, perm: 'settings', back: () => c.openDrawer('tpl', id), blocked: () => db.dtpl.length <= 1 ? 'At least one template must remain.' : '', effects: ['Removes the template', 'Documents already issued keep their content'], run: (r?: any) => { if (db.live && V.persistTemplateDelete) { V.persistTemplateDelete(c, t.id); c.setState({ drawer: null }); c.commit(t.name + ' deleted'); return; } del(db.dtpl, t); V.log(c, 'Template', t.name, 'Template deleted', '', '', r); c.setState({ drawer: null }); c.commit(t.name + ' deleted'); } }), 'settings'));
  return v;
});

// ---------- support & notifications ----------
const TAGS = ['General', 'Order', 'Sell', 'Other payment method', 'KYC', 'Refund'];
V.newThread = (c?: any) => { const db = c.state.db; V.form(c, 'newTh', { title: 'New conversation', sub: 'Starts a message thread the customer sees in the app.', mode: 'New', perm: 'support', cta: 'Send message', fields: [F('cust', 'Customer ID, email or name', '', 'text', null, 1), F('tag', 'Topic', 'General', 'choice', TAGS, 1), F('ref', 'Linked record (optional)', ''), F('msg', 'Message', '', 'area', null, 1)], save: (v?: any) => { const cu = findCust(db, v.cust); if (!cu) return 'No customer matches ' + v.cust; if (db.live && V.persistThreadCreate) { V.persistThreadCreate(c, cu, { tag: v.tag, ref: v.ref, msg: v.msg }); return; } const id = nextNo(db.threads.map((t?: any) => t.id), 'T-', 800), m = V.me(c); db.threads.unshift({ id, cust: cu.id, ref: v.ref || null, tag: v.tag, unread: 0, status: 'open', assignee: m.name, msgs: [{ from: 'admin', who: m.name, text: v.msg, at: now() }] }); V.tell(c, cu.id, 'New message from Mineral Bridge', v.ref || id); V.log(c, 'Support', id, 'Conversation started', '', cu.name); c.setState({ drawer: null }); c.commit('Message sent to ' + cu.name); c.openDrawer('thread', id); } }); };
wrap('thread', (v?: any, c?: any, id?: any) => {
  const db = c.state.db, t = db.threads.find((x?: any) => x.id === id);
  v.actions.push(V.act(c, 'Edit', () => V.form(c, 'th-' + id, { title: 'Edit ' + id, sub: A.cust(db, t.cust).name, mode: 'Edit', perm: 'support', cta: 'Save', back: () => c.openDrawer('thread', id), fields: [F('tag', 'Topic', TAGS.indexOf(t.tag) >= 0 ? t.tag : 'General', 'choice', TAGS, 1), F('ref', 'Linked record', t.ref || ''), F('assignee', 'Assigned to', t.assignee, 'choice', db.admins.filter((a?: any) => a.status === 'active').map((a?: any) => a.name), 1)], save: (x?: any) => { const b = t.tag + ' · ' + t.assignee; t.tag = x.tag; t.ref = x.ref || null; t.assignee = x.assignee; V.log(c, 'Support', id, 'Conversation edited', b, t.tag + ' · ' + t.assignee); c.commit(id + ' saved'); c.openDrawer('thread', id); } }), 2, 'support'));
  v.actions.push(danger(c, 'Delete conversation', () => V.delete(c, 'dth-' + id, { title: 'Delete ' + id, sub: t.msgs.length + ' messages', perm: 'support', back: () => c.openDrawer('thread', id), effects: ['Removes the conversation for both Mineral Bridge and the customer'], run: (r?: any) => { del(db.threads, t); V.log(c, 'Support', id, 'Conversation deleted', '', '', r); c.setState({ drawer: null }); c.commit(id + ' deleted'); } }), 'support'));
  return v;
});
V.newNotif = (c?: any) => { const db = c.state.db; V.form(c, 'newNt', { title: 'Send notification', sub: 'A one-off message, outside the automatic stage updates.', mode: 'New', perm: 'support', cta: 'Send', fields: [F('cust', 'Customer ID, email or name', '', 'text', null, 1), F('msg', 'Message', '', 'area', null, 1), F('ref', 'Linked record (optional)', ''), F('ch', 'Channel', 'all', 'choice', [['all', 'All channels they keep on'], ['email', 'Email'], ['sms', 'SMS'], ['whatsapp', 'WhatsApp'], ['push', 'Push']], 1)], save: (v?: any) => { const cu = findCust(db, v.cust); if (!cu) return 'No customer matches ' + v.cust; if (db.live && V.persistNotification) { V.persistNotification(c, cu, { msg: v.msg, ref: v.ref, ch: v.ch }); return; } const chans = v.ch === 'all' ? ['email', 'sms', 'whatsapp', 'push'].filter(k => cu.prefs[k]) : [v.ch]; if (!chans.length) return cu.name + ' has every channel switched off'; chans.forEach(ch => db.deliveries.unshift({ at: now(), cust: cu.id, event: v.msg.length > 70 ? v.msg.slice(0, 68) + '…' : v.msg, ref: v.ref || 'Manual', channel: ch, status: 'sent' })); V.log(c, 'Notification', cu.id, 'Manual notification sent', '', chans.join(', '), v.msg); c.setState({ drawer: null }); c.commit('Sent to ' + cu.name + ' by ' + chans.join(', ')); } }); };
wrap('notif', (v?: any, c?: any, i?: any) => {
  const db = c.state.db, d = db.deliveries[i];
  v.actions.push(danger(c, 'Delete entry', () => V.delete(c, 'dn-' + i + '-' + d.at, { title: 'Delete notification entry', sub: d.event + ' · ' + d.channel, perm: 'support', back: close(c), effects: ['Removes this line from the delivery log', 'The message itself has already been sent and cannot be recalled'], run: (r?: any) => { del(db.deliveries, d); V.log(c, 'Notification', d.ref, 'Log entry deleted', '', d.channel, r); c.setState({ drawer: null }); c.commit('Entry deleted'); } }), 'support'));
  return v;
});

// ---------- partners ----------
const PTYPES = [['logistics', 'Logistics partner'], ['inspection', 'Testing agency'], ['inspector', 'Agency inspector']];
const partnerFields = (p?: any) => { p = p || {}; return [F('type', 'Type', p.type || 'logistics', 'choice', PTYPES, 1), F('name', 'Name', p.name, 'text', null, 1), F('modes', 'Modes or role (e.g. Road, Air)', p.modes, 'text', null, 1), F('regions', 'Regions covered', p.regions, 'text', null, 1), F('contact', 'Contact', p.contact, 'text', null, 1)]; };
V.newPartner = (c?: any) => { const db = c.state.db; V.form(c, 'newPt', { title: 'New partner', sub: 'Active partners can be picked when assigning shipments and inspections.', mode: 'New', perm: 'logistics', cta: 'Add partner', fields: partnerFields(), save: (v?: any) => { if (db.partners.some((p?: any) => p.name.toLowerCase() === v.name.toLowerCase())) return 'A partner with that name exists'; if (db.live && V.persistPartnerCreate) { V.persistPartnerCreate(c, v); return; } const id = nextNo(db.partners.map((p?: any) => p.id), 'PT-', 0); db.partners.push(Object.assign({ id, active: true }, v)); V.log(c, 'Partner', v.name, 'Partner added'); c.setState({ drawer: null }); c.commit(v.name + ' added'); c.openDrawer('partner', id); } }); };
wrap('partner', (v?: any, c?: any, id?: any) => {
  const db = c.state.db, p = db.partners.find((x?: any) => x.id === id), used = () => db.orders.filter((o?: any) => (o.ship && o.ship.partner === p.name) || (o.insp && o.insp.inspector === p.name)).length;
  v.actions.push(V.act(c, 'Edit partner', () => V.form(c, 'pt-' + id, { title: 'Edit ' + p.name, sub: p.id, mode: 'Edit', perm: 'logistics', cta: 'Save partner', back: () => c.openDrawer('partner', id), fields: partnerFields(p), save: (x?: any) => { const old = p.name; Object.assign(p, x); if (p.live && V.persistPartner) { V.persistPartner(c, p); c.commit(p.name + ' saved'); c.openDrawer('partner', id); return; } if (old !== p.name) db.orders.forEach((o?: any) => { if (o.ship && o.ship.partner === old) o.ship.partner = p.name; if (o.insp && o.insp.inspector === old) o.insp.inspector = p.name; }); V.log(c, 'Partner', p.name, 'Partner edited', old, p.name); c.commit(p.name + ' saved'); c.openDrawer('partner', id); } }), 2, 'logistics'));
  v.actions.push(danger(c, 'Delete partner', () => V.delete(c, 'dp-' + id, { title: 'Delete ' + p.name, sub: p.modes, perm: 'logistics', back: () => c.openDrawer('partner', id), effects: [used() ? used() + ' past shipments or inspections keep the partner name for their history' : 'Not used on any shipment or inspection', 'Removes the partner from the list — it can no longer be assigned'], run: (r?: any) => { if (p.live && V.persistPartnerDelete) { V.persistPartnerDelete(c, p, r); return; } del(db.partners, p); V.log(c, 'Partner', p.name, 'Partner deleted', '', '', r); c.setState({ drawer: null }); c.commit(p.name + ' deleted'); } }), 'logistics'));
  return v;
});

// ---------- payments ----------
V.recordPayment = (c?: any) => {
  const db = c.state.db;
  // Live: confirm a buyer-submitted payment with the bank/gateway reference (POST /payments/:orderRef/confirm).
  const liveDue = db.live
    ? db.orders.filter((o?: any) => o.live && o.kind === 'buy' && o.pay && o.pay.status === 'pending' && !o.rejected)
    : [];
  const due = db.live
    ? liveDue
    : db.orders.filter((o?: any) => o.kind === 'buy' && !o.hold && !o.rejected && A.BUY[o.stage] && A.BUY[o.stage].key === 'paid');
  if (!due.length) {
    return c.toast(db.live
      ? 'No submitted payments are waiting for confirmation. Buyers must submit payment in the app first.'
      : 'No orders are waiting for payment');
  }
  V.form(c, 'recPay', {
    title: db.live ? 'Confirm payment' : 'Record payment',
    sub: db.live
      ? 'Confirm money the buyer already submitted. Enter the bank or gateway reference.'
      : 'For money received outside the app, for example a direct bank transfer.',
    mode: 'New', perm: 'finance', cta: db.live ? 'Confirm payment' : 'Record payment',
    fields: [
      F('order', 'Order', due[0].id, 'choice', due.map((o?: any) => [o.id, o.id + ' · ' + A.cname(A.cust(db, o.cust)) + ' · ' + A.money(o.total)]), 1),
      ...(db.live ? [] : [F('method', 'Method', 'Bank transfer', 'choice', ['Bank transfer', 'UPI', 'Net banking', 'Other method'], 1)]),
      F('ref', 'Bank or gateway reference', '', 'text', null, 1),
    ],
    save: (v?: any) => {
      const o = db.orders.find((x?: any) => x.id === v.order);
      if (!o) return 'Choose an order';
      if (!String(v.ref || '').trim()) return 'Enter the bank or gateway reference';
      if (db.live && V.persistPaymentConfirm) { V.persistPaymentConfirm(c, o, String(v.ref).trim()); return; }
      const t = now(), m = V.me(c);
      A.stageData(db, o, 'paid', t, { method: v.method, by: m.name });
      o.pay.ref = v.ref;
      o.hist.push({ at: t, who: m.name, role: m.label, text: 'Payment made', note: 'Recorded by Mineral Bridge · ' + v.ref });
      o.stage++; o.sAt = t;
      V.log(c, 'Payment', o.id, 'Payment recorded', '', A.money(o.pay.amount), v.ref);
      c.setState({ drawer: null });
      c.commit('Payment recorded on ' + o.id + ' — confirm it next');
      c.openOrder(o.id);
    },
  });
};

// ---------- admins & roles ----------
wrap('admin', (v?: any, c?: any, id?: any) => {
  const db = c.state.db, a = db.admins.find((x?: any) => x.id === id); sync(db);
  v.actions.push(V.act(c, 'Edit admin', () => V.form(c, 'ad-' + id, { title: 'Edit ' + a.name, sub: a.email, mode: 'Edit', perm: 'settings', cta: 'Save admin', back: () => c.openDrawer('admin', id), fields: [F('name', 'Full name', a.name, 'text', null, 1), F('email', 'Work email', a.email, 'text', null, 1), F('role', 'Role', a.role, 'choice', A.ROLES.map((r?: any) => [r[0], r[1]]), 1)], save: (x?: any) => { if (x.email.indexOf('@') < 0) return 'Enter a work email'; if (db.admins.some((y?: any) => y !== a && y.email.toLowerCase() === x.email.toLowerCase())) return 'Another admin uses that email'; if (a.role === 'super' && x.role !== 'super' && db.admins.filter((y?: any) => y.role === 'super' && y.status === 'active').length <= 1) return 'Keep at least one active Super admin'; const b = a.name + ' · ' + V.roleLabel(a.role); if (a.live && db.live && V.persistAdminUpdate) { V.persistAdminUpdate(c, a, { name: x.name, email: x.email, role: x.role }); return; } Object.assign(a, x); V.log(c, 'Admin', a.email, 'Admin edited', b, a.name + ' · ' + V.roleLabel(a.role)); c.commit(a.name + ' saved'); c.openDrawer('admin', id); } }), 2, 'settings'));
  v.actions.push(danger(c, 'Delete admin', () => V.delete(c, 'dad-' + id, { title: 'Delete ' + a.name, sub: V.roleLabel(a.role) + ' · ' + a.email, perm: 'settings', back: () => c.openDrawer('admin', id), blocked: () => a.email === V.me(c).email ? 'You cannot delete your own account.' : a.role === 'super' && db.admins.filter((y?: any) => y.role === 'super').length <= 1 ? 'This is the only Super admin.' : '', effects: ['Removes their access immediately', 'Their past actions stay in the audit log under their name'], run: (r?: any) => { if (a.live && db.live && V.persistAdminDelete) { V.persistAdminDelete(c, a, r); return; } del(db.admins, a); V.log(c, 'Admin', a.email, 'Admin deleted', '', '', r); c.setState({ drawer: null }); c.commit(a.name + ' deleted'); } }), 'settings'));
  return v;
});
V.newRole = (c?: any) => { const db = c.state.db; sync(db); V.form(c, 'newRole', { title: 'New role', sub: 'Start from an existing role’s permissions, then adjust them in the role panel.', mode: 'New', perm: 'settings', cta: 'Create role', fields: [F('label', 'Role name', '', 'text', null, 1), F('copy', 'Copy permissions from', '', 'choice', [['', 'Start empty (view only)']].concat(A.ROLES.filter((r?: any) => r[0] !== 'super').map((r?: any) => [r[0], r[1]])))], save: (v?: any) => { if (A.ROLES.some((r?: any) => r[1].toLowerCase() === v.label.toLowerCase())) return 'A role with that name exists'; if (db.live && V.persistRoleCreate) { V.persistRoleCreate(c, { label: v.label, copy: v.copy }); return; } const key = 'r_' + v.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + (now() % 1000); db.customRoles = (db.customRoles || []).concat([[key, v.label]]); V.perms(db)[key] = v.copy ? (V.perms(db)[v.copy] || []).slice() : []; sync(db); V.log(c, 'Role', v.label, 'Role created', '', v.copy ? 'copied from ' + V.roleLabel(v.copy) : 'empty'); c.setState({ drawer: null }); c.commit(v.label + ' created'); c.openDrawer('role', key); } }); };
wrap('role', (v?: any, c?: any, key?: any) => {
  const db = c.state.db, custom = (db.customRoles || []).find((r?: any) => r[0] === key); sync(db);
  if (key !== 'super') v.actions.push(V.act(c, 'Rename role', () => V.form(c, 'rr-' + key, { title: 'Rename role', sub: V.roleLabel(key), mode: 'Edit', perm: 'settings', cta: 'Save name', back: () => c.openDrawer('role', key), fields: [F('label', 'Role name', V.roleLabel(key), 'text', null, 1)], save: (x?: any) => { if (A.ROLES.some((r?: any) => r[0] !== key && r[1].toLowerCase() === x.label.toLowerCase())) return 'A role with that name exists'; if (db.live && V.persistRole) { V.persistRole(c, key, { label: x.label }, 'Renamed to ' + x.label); c.openDrawer('role', key); return; } const b = V.roleLabel(key); if (custom) custom[1] = x.label; else { db.roleLabels = db.roleLabels || {}; db.roleLabels[key] = x.label; } sync(db); V.log(c, 'Role', x.label, 'Role renamed', b, x.label); c.commit('Renamed to ' + x.label); c.openDrawer('role', key); } }), 2, 'settings'));
  if (key !== 'super') v.actions.push(danger(c, 'Delete role', () => V.delete(c, 'drole-' + key, { title: 'Delete ' + V.roleLabel(key), sub: 'Role', perm: 'settings', back: () => c.openDrawer('role', key), blocked: () => !custom ? 'Built-in roles are used by the order steps and cannot be deleted. Rename it or change its permissions instead.' : db.admins.some((a?: any) => a.role === key) ? 'Move the admins with this role to another role first.' : '', effects: ['Removes the role and its permissions'], run: (r?: any) => { if (db.live && V.persistRoleDelete) { V.persistRoleDelete(c, key, r); return; } db.customRoles = db.customRoles.filter((x?: any) => x[0] !== key); delete V.perms(db)[key]; sync(db); V.log(c, 'Role', custom[1], 'Role deleted', '', '', r); c.setState({ drawer: null }); c.commit(custom[1] + ' deleted'); } }), 'settings'));
  return v;
});

// ---------- audit export ----------
V.exportAudit = (c?: any) => { const rows = [['Time', 'Actor', 'Role', 'Entity', 'Record', 'Action', 'Before', 'After', 'Note', 'IP']].concat(c.state.db.audit.map((e?: any) => [new Date(e.at).toISOString(), e.actor, e.role, e.entity, e.eid, e.action, e.before, e.after, e.note, e.ip])); const csv = rows.map(r => r.map(x => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\n'); V.download('mineral-bridge-audit-log.csv', csv, 'text/csv'); V.log(c, 'Audit', '', 'Audit log exported', '', rows.length - 1 + ' rows'); c.commit('Exported ' + (rows.length - 1) + ' entries'); };

// ---------- "New" buttons on each page ----------
const page0 = V.page;
V.page = (c?: any) => {
  sync(c.state.db);
  const out = page0(c), nav = c.state.nav, tab = (c.state.tab || {})[nav];
  const add = (label?: any, fn?: any, perm?: any, kind?: any) => { out.tools = (out.tools || []).concat([V.act(c, label, fn, kind || 1, perm)]); out.hasTools = true; };
  if (nav === 'buy') add('New buy order', () => V.newBuy(c), 'ops');
  if (nav === 'sell') add('New sell request', () => V.newSell(c), 'ops');
  if (nav === 'customers') { if ((tab || 'Customers') === 'Customers') add('New customer', () => V.newCustomer(c), 'kyc'); else add('New KYC submission', () => V.newKyc(c), 'kyc'); }
  if (nav === 'support') add('New conversation', () => V.newThread(c), 'support');
  if (nav === 'notifications') add('Send notification', () => V.newNotif(c), 'support');
  if (nav === 'logistics') add('New partner', () => V.newPartner(c), 'logistics');
  if (nav === 'payments' && (tab || 'Incoming') === 'Incoming') add('Record payment', () => V.recordPayment(c), 'finance');
  if (nav === 'refunds') add('New refund request', () => V.newRefund(c), 'finance');
  if (nav === 'documents') { if ((tab || 'Register') === 'Register') add('New document', () => V.newDoc(c), 'ops'); else add('New template', () => V.newTpl(c), 'settings'); }
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- kept as in the design source
  if (nav === 'audit') out.tools = (out.tools || []).concat([{ label: 'Export CSV', style: V.B[2], go: () => V.exportAudit(c) }]), out.hasTools = true;
  if (nav === 'settings' && tab === 'Roles & permissions') add('New role', () => V.newRole(c), 'settings');
  return out;
};

// ---------- categories & subcategories ----------
const catLots = (db?: any, ids?: any) => db.lots.filter((l?: any) => ids.indexOf(l.mineral) >= 0);
V.editCat = (c?: any, id?: any) => { const db = c.state.db, k = V.cats(db).find((x?: any) => x.id === id); V.form(c, 'cat-' + id, { title: 'Edit category', sub: k.label + ' · key ' + k.id, mode: 'Edit', perm: 'catalogue', cta: 'Save category', back: () => c.openDrawer('cat', id),
  fields: [F('label', 'Category name', k.label, 'text', null, 1), F('active', 'Visibility in the app', k.active ? 'on' : 'off', 'choice', [['on', 'Shown'], ['off', 'Hidden']], 1)],
  save: (v?: any) => { if (V.cats(db).some((x?: any) => x !== k && x.label.toLowerCase() === v.label.toLowerCase())) return 'Another category has that name'; const b = k.label + (k.active ? '' : ' (hidden)'); const was = { name: k.label, active: k.active }; k.label = v.label; k.active = v.active === 'on'; V.log(c, 'Category', k.id, 'Category edited', b, k.label + (k.active ? '' : ' (hidden)')); c.commit(k.label + ' saved'); c.openDrawer('cat', id); if (db.live && V.persistCategory) { if (was.name !== k.label) V.persistCategory(c, 'rename', k, { name: k.label }); if (was.active !== k.active) V.persistCategory(c, 'visibility', k, { active: k.active }); } } }); };
V.delCat = (c?: any, id?: any) => { const db = c.state.db, k = V.cats(db).find((x?: any) => x.id === id), lots = () => catLots(db, k.subs.map((s?: any) => s.id)); V.delete(c, 'dcat-' + id, { title: 'Delete ' + k.label, sub: 'Category · ' + k.subs.length + ' subcategories', perm: 'catalogue', back: () => c.openDrawer('cat', id),
  blocked: () => lots().length ? k.label + ' has ' + lots().length + ' lots. Move them to another subcategory or delete them first — or hide the category instead.' : '',
  alt: k.active ? V.act(c, 'Hide instead', () => { k.active = false; V.log(c, 'Category', k.id, 'Hidden in app'); c.commit(k.label + ' hidden'); c.openDrawer('cat', id); if (db.live && V.persistCategory) V.persistCategory(c, 'visibility', k, { active: false }); }, 1, 'catalogue') : null,
  effects: ['Removes the category and its ' + k.subs.length + ' subcategories', 'Buyers and sellers no longer see it in the app'],
  run: (r?: any) => { db.cats.splice(db.cats.indexOf(k), 1); V.log(c, 'Category', k.id, 'Category deleted', k.label, '', r); c.setState({ drawer: null }); c.commit(k.label + ' deleted'); if (db.live && V.persistCategory) V.persistCategory(c, 'delete', k); } }); };
V.editSub = (c?: any, sid?: any) => { const db = c.state.db, fnd = V.subOf(db, sid), k = fnd.cat, s = fnd.sub; V.form(c, 'sub-' + sid, { title: 'Edit subcategory', sub: s.label + ' · key ' + s.id, mode: 'Edit', perm: 'catalogue', cta: 'Save subcategory', back: () => c.openDrawer('cat', k.id),
  fields: [F('label', 'Subcategory name', s.label, 'text', null, 1), F('cat', 'Category', k.id, 'choice', V.cats(db).map((x?: any) => [x.id, x.label]), 1), F('active', 'Sellers and buyers can pick it', s.active ? 'on' : 'off', 'choice', [['on', 'On'], ['off', 'Off']], 1)],
  save: (v?: any) => { const dst = V.cats(db).find((x?: any) => x.id === v.cat); if (dst.subs.some((x?: any) => x !== s && x.label.toLowerCase() === v.label.toLowerCase())) return dst.label + ' already has ' + v.label; const b = k.label + ' › ' + s.label, was = { name: s.label, active: s.active }; s.label = v.label; s.active = v.active === 'on'; if (dst !== k) { k.subs.splice(k.subs.indexOf(s), 1); dst.subs.push(s); } V.log(c, 'Category', s.id, 'Subcategory edited', b, dst.label + ' › ' + s.label); c.commit(s.label + ' saved'); c.openDrawer('cat', dst.id); if (db.live && V.persistSubcategory) { const P = V.persistSubcategory; if (was.name !== s.label) P(c, 'rename', k, s, { name: s.label }); if (was.active !== s.active) P(c, 'visibility', k, s, { active: s.active }); if (dst !== k) P(c, 'move', k, s, { categorySlug: dst.id }); } } }); };
V.delSub = (c?: any, sid?: any) => { const db = c.state.db, fnd = V.subOf(db, sid), k = fnd.cat, s = fnd.sub, lots = () => catLots(db, [s.id]); V.delete(c, 'dsub-' + sid, { title: 'Delete ' + s.label, sub: 'Subcategory of ' + k.label, perm: 'catalogue', back: () => c.openDrawer('cat', k.id),
  blocked: () => lots().length ? s.label + ' has ' + lots().length + ' lots. Move or delete them first — or turn the subcategory off instead.' : '',
  alt: s.active ? V.act(c, 'Turn off instead', () => { s.active = false; V.log(c, 'Category', s.id, 'Subcategory off'); c.commit(s.label + ' turned off'); c.openDrawer('cat', k.id); if (db.live && V.persistSubcategory) V.persistSubcategory(c, 'visibility', k, s, { active: false }); }, 1, 'catalogue') : null,
  effects: ['Removes ' + s.label + ' from ' + k.label, 'Sellers can no longer pick it'],
  run: (r?: any) => { k.subs.splice(k.subs.indexOf(s), 1); V.log(c, 'Category', s.id, 'Subcategory deleted', s.label, '', r); c.commit(s.label + ' deleted'); c.openDrawer('cat', k.id); if (db.live && V.persistSubcategory) V.persistSubcategory(c, 'delete', k, s); } }); };
wrap('cat', (v?: any, c?: any, id?: any) => {
  const db = c.state.db, k = V.cats(db).find((x?: any) => x.id === id); if (!k) return v;
  const sec = v.sections[0];
  if (sec) { sec.title = 'Subcategories · ' + k.subs.length; sec.items.forEach((it?: any, i?: any) => { const s = k.subs[i]; it.btns = [{ label: 'Edit', go: () => V.can(c, 'catalogue') ? V.editSub(c, s.id) : c.toast('Needs Catalogue manager') }, { label: 'Delete', danger: true, go: () => V.can(c, 'catalogue') ? V.delSub(c, s.id) : c.toast('Needs Catalogue manager') }]; }); }
  v.inputs = v.inputs.filter((x?: any) => x.label !== 'Category name');
  v.actions = v.actions.filter((a?: any) => a.label !== 'Save name' && a.label !== 'Delete category');
  v.actions.unshift(V.act(c, 'Edit category', () => V.editCat(c, id), 1, 'catalogue'));
  v.actions.push(danger(c, 'Delete category', () => V.delCat(c, id), 'catalogue'));
  return v;
});
wrap('sub', (v?: any, c?: any, sid?: any) => {
  const fnd = V.subOf(c.state.db, sid); if (!fnd) return v;
  v.inputs = []; v.actions = v.actions.filter((a?: any) => ['Save name', 'Move', 'Delete'].indexOf(a.label) < 0);
  v.actions.unshift(V.act(c, 'Edit subcategory', () => V.editSub(c, sid), 1, 'catalogue'));
  v.actions.push(danger(c, 'Delete subcategory', () => V.delSub(c, sid), 'catalogue'));
  return v;
});
V.catTable = (c?: any) => {
  const db = c.state.db, cats = V.cats(db), gate = (fn?: any) => () => V.can(c, 'catalogue') ? fn() : c.toast('Needs Catalogue manager — you are signed in as ' + V.me(c).label);
  const list = cats.filter((k?: any) => V.match(c, [k.label, k.id].concat(k.subs.map((s?: any) => s.label))));
  return V.table(c, 'cats', [['CATEGORY', '1.3fr', (k?: any) => k.label], ['SUBCATEGORIES', '2.4fr'], ['LOTS', '.5fr', (k?: any) => catLots(db, k.subs.map((s?: any) => s.id)).length], ['LISTED', '.5fr'], ['STATUS', '.8fr', (k?: any) => k.active ? 1 : 0], ['', '150px', null, 1]], list, (k?: any) => {
    const lots = catLots(db, k.subs.map((s?: any) => s.id));
    return { cells: [{ t: k.label, s: k.id, b: 1 }, { t: k.subs.map((s?: any) => s.label + (s.active ? '' : ' (off)')).join(', ') || 'None yet', s: k.subs.length + ' subcategories' }, { t: lots.length }, { t: lots.filter((l?: any) => l.status === 'listed').length }, { t: k.active ? 'Shown in app' : 'Hidden', pill: k.active ? 'ok' : 'mute' }, { t: '', btns: [{ label: 'Edit', go: gate(() => V.editCat(c, k.id)) }, { label: 'Delete', danger: true, go: gate(() => V.delCat(c, k.id)) }] }], go: () => c.openDrawer('cat', k.id) };
  }, { empty: 'No categories match this search.' });
};
V.crudReady = true;

/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-v5.js. Behaviour and styles are kept as designed.
import { MBA, MBV } from './registry';
import { kycDocPreview } from './kycDocs';

const V = MBV, D = V.D, A = MBA;
const now = () => Date.now();
const kv = (k?: any, v?: any) => ({ k, v: v == null || v === '' ? '—' : String(v) });
const F = (k?: any, label?: any, def?: any, type?: any, opts?: any, req?: any) => ({ k, label, def: def == null ? '' : def, type: type || 'text', opts: opts || [], req: !!req });
const ix = (o?: any, key?: any) => A.stages(o).findIndex((s?: any) => s.key === key);
const curKey = (o?: any) => (A.stages(o)[o.stage] || {}).key;

// ---------- navigation ----------
if (!V.NAV.some((g?: any) => g[1].some((i?: any) => i[0] === 'orders'))) {
  V.NAV[0][1].splice(1, 0, ['orders', 'All orders', 'list']);
  V.NAV[2][1].splice(1, 0, ['inventory', 'Inventory & stock', 'box']);
}
V.TITLES.orders = ['All orders', 'Buy orders, sell requests and auction purchases in one list'];
V.TITLES.inventory = ['Inventory & stock', 'What is on hand, reserved for orders and available to sell'];

// ---------- row actions on tables ----------
V.rowActs = {};
const table0 = V.table;
V.table = (c?: any, id?: any, cols?: any, items?: any, row?: any, opt?: any) => {
  const ra = V.rowActs[id];
  const docs = id === 'docs';
  if (!ra && !docs) return table0(c, id, cols, items, row, opt);
  const cols2 = ra ? cols.concat([['', id === 'insp' ? '240px' : '150px', null, 1]]) : cols;
  return table0(c, id, cols2, items, (it?: any) => {
    const r = row(it);
    if (docs) r.cells = r.cells.map((x?: any) => x && x.pill && V.docWord[x.t] ? Object.assign({}, x, { t: V.docWord[x.t] }) : x);
    if (ra) r.cells = r.cells.concat([{ t: '', btns: ra(c, it) }]);
    return r;
  }, opt);
};
const viaDrawer = (c?: any, type?: any, id?: any, label?: any) => () => { let v; try { v = D[type](c, id); } catch { return c.toast('Could not open ' + id); } const a = (v.actions || []).find((x?: any) => x.label === label); if (a) a.go(); else c.toast(label + ' is not available for ' + id); };
V.rowActs.lots = (c?: any, l?: any) => [{ label: 'Edit', go: viaDrawer(c, 'lot', l.id, 'Edit details') }, { label: 'Delete', danger: true, go: viaDrawer(c, 'lot', l.id, 'Delete lot') }];
V.rowActs.pt = (c?: any, p?: any) => [{ label: 'Edit', go: viaDrawer(c, 'partner', p.id, 'Edit partner') }, { label: 'Delete', danger: true, go: viaDrawer(c, 'partner', p.id, 'Delete partner') }];
V.rowActs.insp = (c?: any, o?: any) => (o.sgs ? [{ label: 'Report', go: () => V.downloadReport(c, o) }, { label: 'Replace', go: () => V.can(c, 'inspection') ? V.uploadReport(c, o) : c.toast('Needs Inspection coordinator') }] : [{ label: 'Upload report', go: () => V.can(c, 'inspection') ? V.uploadReport(c, o) : c.toast('Needs Inspection coordinator') }]).concat([{ label: 'Edit', go: () => V.editInsp(c, o) }]);
V.rowActs.auctions = (c?: any, a?: any) => [{ label: 'Edit', go: viaDrawer(c, 'auction', a.id, 'Edit auction') }, { label: 'Delete', danger: true, go: viaDrawer(c, 'auction', a.id, 'Delete auction') }];

// ---------- document status words ----------
V.docWord = { issued: 'Valid', processing: 'Pending', replaced: 'Replaced', superseded: 'Replaced', cancelled: 'Cancelled', void: 'Cancelled' };
const chips0 = V.chips;
V.chips = (c?: any, id?: any, labels?: any, counts?: any) => { const out = chips0(c, id, labels, counts); if (id === 'docs') out.list.forEach((x?: any, i?: any) => { const w = V.docWord[labels[i]]; if (w) x.label = w + (counts && counts[i] != null ? ' · ' + counts[i] : ''); }); return out; };
const doc0 = D.doc;
D.doc = (c?: any, no?: any) => { const v = doc0(c, no), d = c.state.db.docs.find((x?: any) => x.no === no); if (d && V.docWord[d.status]) v.pill = V.docWord[d.status]; v.fields = (v.fields || []).concat([kv('Status meaning', d && d.status === 'issued' ? 'This is the current, valid copy.' : d && (d.status === 'replaced' || d.status === 'superseded') ? 'A newer version was issued. Use the latest one.' : d && (d.status === 'cancelled' || d.status === 'void') ? 'This document was cancelled and should not be relied on.' : 'Issued once the payment is confirmed.')]); return v; };

// ---------- catalogue: no reference price, test report after draft ----------
const lot0 = D.lot;
D.lot = (c?: any, id?: any) => {
  const v = lot0(c, id), db = c.state.db, l = A.lot(db, id);
  v.inputs = (v.inputs || []).filter((i?: any) => !/^Reference price/.test(i.label));
  v.fields = (v.fields || []).filter((f?: any) => !/Reference price|Ref price/i.test(f.k)).concat([kv('Price', 'Set per order from the market rate on the day — not fixed on the lot')]);
  if (!l.cert) v.fields.unshift(kv('Test report', 'Missing — add one before publishing'));
  v.actions.unshift(V.act(c, l.cert ? 'Update test report' : 'Add test report', () => V.form(c, 'tr-' + id, { title: (l.cert ? 'Update' : 'Add') + ' test report', sub: l.id + ' · ' + l.name, mode: l.cert ? 'Edit' : 'New', perm: 'catalogue', cta: 'Save test report', back: () => c.openDrawer('lot', id),
    fields: [F('lab', 'Testing agency', l.lab || 'SGS Nigeria', 'choice', db.partners.filter((p?: any) => p.type === 'inspection').map((p?: any) => p.name).concat(l.lab && !db.partners.some((p?: any) => p.name === l.lab) ? [l.lab] : []), 1), F('cert', 'Report / certificate number', l.cert, 'text', null, 1), F('grade', 'Certified grade', l.grade, 'text', null, 1), F('file', 'Attach the report file?', 'later', 'choice', [['now', 'Choose a file now'], ['later', 'Not now']], 1)],
    save: (x?: any) => {
      const b = l.cert || 'none'; l.lab = x.lab; l.cert = x.cert; l.grade = x.grade;
      const docs = V.ldocs ? V.ldocs(l) : null;
      const ex = docs && docs.find((d?: any) => d.type === 'Test report');
      if (ex && ex.name.indexOf(x.cert) < 0) { ex.history = (ex.history || []).concat([{ ver: ex.ver, name: ex.name, at: ex.at, by: ex.by }]); ex.ver++; ex.name = 'Test report ' + x.cert + '.pdf'; ex.at = now(); ex.by = V.me(c).name; l.docs = docs.map((d?: any) => d.name); }
      else if (docs && !ex) { docs.unshift({ id: l.id + '-D' + (docs.length + 1), name: 'Test report ' + x.cert + '.pdf', type: 'Test report', ver: 1, at: now(), by: V.me(c).name, size: '240 KB', visible: true, history: [] }); l.docs = docs.map((d?: any) => d.name); }
      V.log(c, 'Lot', l.id, 'Test report saved', b, x.cert);
      const pick = x.file === 'now' && V.pick;
      c.commit('Test report ' + x.cert + ' saved' + (l.status === 'draft' ? ' — you can publish now' : ''));
      c.openDrawer('lot', id);
      if (pick) V.pick('.pdf,.jpg,.jpeg,.png', false, (fs?: any) => { const f = fs[0]; if (!f || !docs) return; const d = docs[0]; d.file = f; d.name = f.name; d.size = Math.max(1, Math.round(f.size / 1024)) + ' KB'; l.docs = docs.map((z?: any) => z.name); c.commit(f.name + ' attached'); });
    } }), l.cert ? 2 : 1, 'catalogue'));
  return v;
};
const newLot0 = D.newLot;
D.newLot = (c?: any) => { const v = newLot0(c); v.inputs = (v.inputs || []).filter((i?: any) => !/^Reference price/.test(i.label)); v.sub = 'Saved as a draft. Add the test report later from the lot to publish it. Prices are set per order from the market rate.'; return v; };

// ---------- auctions: proper create form + purchase tracking ----------
D.newAuction = (c?: any) => {
  const db = c.state.db, lots = db.lots.filter((l?: any) => l.status === 'listed' && l.avail > 0);
  c._forms = c._forms || {};
  c._forms.__newAu = { title: 'New auction', sub: 'Pick a lot with stock. The starting bid is set by you from today’s market rate.', mode: 'New', perm: 'auction', cta: 'Schedule auction',
    fields: [F('lot', 'Lot', lots[0] ? lots[0].id : '', 'choice', lots.map((l?: any) => [l.id, l.id + ' · ' + l.name + ' · ' + A.qfmt(l.avail, l.unit)]), 1), F('qty', 'Quantity to auction', '', 'num', null, 1), F('start', 'Starting bid ($)', '', 'num', null, 1), F('reserve', 'Reserve price ($, optional — unsold below this)', '', 'num'), F('step', 'Bid step ($)', db.settings.bidStep, 'num', null, 1), F('opens', 'Bidding opens', '1h', 'choice', [['now', 'Now'], ['1h', 'In 1 hour'], ['24h', 'Tomorrow']], 1), F('hours', 'Runs for (hours)', 48, 'num', null, 1)],
    save: (x?: any) => {
      const l = A.lot(db, x.lot); if (!l) return 'Pick a lot';
      if (!(x.qty > 0) || x.qty > l.avail) return 'Quantity must be more than 0 and at most ' + A.qfmt(l.avail, l.unit);
      if (l.min && x.qty < l.min) return 'Quantity is below the lot minimum of ' + A.qfmt(l.min, l.unit);
      if (!(x.start > 0)) return 'Enter a starting bid';
      if (x.reserve != null && x.reserve > 0 && x.reserve < x.start) return 'Reserve must be at or above the starting bid';
      if (!(x.step > 0)) return 'Bid step must be more than 0';
      if (!(x.hours >= 1)) return 'Run for at least 1 hour';
      const opens = now() + (({ now: 0, '1h': 1, '24h': 24 } as any)[x.opens] || 0) * A.H;
      let n = 313; db.auctions.forEach((a?: any) => { const k = +String(a.id).slice(2); if (k >= n) n = k + 1; });
      const a = { id: 'A-' + n, lot: l.id, qty: x.qty, start: x.start, reserve: x.reserve || 0, step: x.step, opens, closes: opens + x.hours * A.H, reminders: 0, bids: [], paused: false, remaining: 0, cancelled: '', closed: false, winner: null, orderId: null, extended: 0 };
      db.auctions.unshift(a); V.log(c, 'Auction', a.id, 'Auction scheduled', '', A.money(a.start) + ' · ' + A.qfmt(a.qty, l.unit));
      if (db.live && V.persistAuction) V.persistAuction(c, { productId: l.productId, name: l.name, qty: x.qty, unit: l.unit, start: x.start, step: x.step, reserve: x.reserve, opens, hours: x.hours });
      c.form = {}; c.commit(a.id + (x.opens === 'now' ? ' is live' : ' scheduled — opens ' + A.fmt(opens))); c.openDrawer('auction', a.id);
    } };
  if (!lots.length) return { title: 'New auction', sub: 'No listed lot has stock to auction.', fields: [], sections: [], inputs: [], actions: [{ label: 'Open catalogue', style: V.B[1], go: () => c.go('catalogue') }] };
  return D.form(c, '__newAu');
};
const au0 = D.auction;
D.auction = (c?: any, id?: any) => {
  const v = au0(c, id), db = c.state.db, a = db.auctions.find((x?: any) => x.id === id);
  if (a && a.reserve) v.fields = (v.fields || []).concat([kv('Reserve price', A.money(a.reserve) + (V.top(a) && V.top(a).amt >= a.reserve ? ' · met' : ' · not met yet'))]);
  const o = a && a.orderId && db.orders.find((x?: any) => x.id === a.orderId);
  if (o) {
    const S = A.BUY, n = A.nextInfo(o);
    v.sections = [{ title: 'Winner purchase tracking · ' + o.id, items: S.slice(7).map((s?: any, k?: any) => { const i = k + 7, done = i < o.stage || n.done, cur = i === o.stage && !n.done; const h = o.hist.slice().reverse().find((x?: any) => x.text === s.label); return { t: s.label, s: h ? A.fmt(h.at) + ' · ' + h.who : A.OWNER[s.owner], r: done ? 'Done' : cur ? (o.hold ? 'On hold' : 'Current') : 'Next', pill: true, pillStyle: V.pill(done ? 'ok' : cur ? (o.hold ? 'warn' : 'info') : 'mute'), go: () => c.openOrder(o.id) }; }) }].concat(v.sections || []);
    v.actions = [{ label: 'Track purchase ' + o.id, style: V.B[1], go: () => c.openOrder(o.id) }].concat(v.actions.filter((x?: any) => x.label.indexOf('Open order') !== 0));
  }
  return v;
};

// ---------- third-party inspection editing ----------
V.editInsp = (c?: any, o?: any) => {
  const db = c.state.db;
  if (!o.insp) { c.toast('No agency has been booked yet — book it from the request'); return c.openOrder(o.id); }
  const ag = db.partners.filter((p?: any) => p.type === 'inspection').map((p?: any) => p.name), ins = db.partners.filter((p?: any) => p.type === 'inspector').map((p?: any) => p.name);
  const withCur = (list?: any, v?: any) => v && list.indexOf(v) < 0 ? [v].concat(list) : list;
  const r = o.insp.res, g = o.sgs;
  const inspectorOpts = withCur(ins, o.insp.inspector);
  const inspectorDef = o.insp.inspector || inspectorOpts[0] || 'Not recorded';
  const fields = [F('agency', 'Inspection agency', o.insp.agency || ag[0] || 'Inspection', 'choice', withCur(ag, o.insp.agency).length ? withCur(ag, o.insp.agency) : [o.insp.agency || 'Inspection'], 1), F('inspector', 'Agency inspector', inspectorDef, 'choice', inspectorOpts.length ? inspectorOpts : [inspectorDef], 1), F('date', 'Date', o.insp.date, 'text', null, 1), F('time', 'Time', o.insp.time, 'text', null, 1), F('location', 'Location', o.insp.location, 'area', null, 1)]
    .concat(r ? [F('weight', 'Weight recorded by the agency (' + o.sell.unit + ')', r.weight, 'num', null, 1), F('seals', 'Agency seal numbers', r.seals, 'text', null, 1), F('result', 'Agency result', r.result, 'text', null, 1), F('notes', 'Agency inspector notes', r.notes, 'area')] : [])
    .concat(g ? [F('no', 'Agency report number', g.no, 'text', null, 1), F('grade', 'Certified grade', g.grade, 'text', null, 1), F('net', 'Certified net quantity (' + o.sell.unit + ')', g.net, 'num', null, 1), F('sresult', 'Report result', g.result, 'choice', ['Compliant', 'Compliant with remarks', 'Non-compliant'], 1)] : []);
  V.form(c, 'ei-' + o.id, { title: 'Edit third-party inspection', sub: o.id + ' · ' + (g ? 'report submitted' : r ? 'inspection done' : 'booked'), mode: 'Edit', perm: 'inspection', cta: 'Save inspection', fields,
    save: (x?: any) => {
      if (db.live && o.live && g && V.persistInspectionRevision) {
        V.persistInspectionRevision(c, o, { no: x.no, grade: x.grade, net: x.net, result: x.sresult, remarks: x.remarks, weight: x.weight, seals: x.seals, onSite: x.result, notes: x.notes, inspector: x.inspector, agency: x.agency });
        return;
      }
      const b = [o.insp.agency, o.insp.date, r ? r.weight : '', g ? g.no + ' ' + g.grade : ''].join(' · ');
      Object.assign(o.insp, { agency: x.agency, inspector: x.inspector, date: x.date, time: x.time, location: x.location });
      if (r) Object.assign(r, { weight: x.weight, seals: x.seals, result: x.result, notes: x.notes || '' });
      if (g) Object.assign(g, { no: x.no, grade: x.grade, net: x.net != null ? +x.net : g.net, result: x.sresult, agency: x.agency });
      V.log(c, 'Sell request', o.id, 'Inspection edited', b, [x.agency, x.date, r ? x.weight : '', g ? x.no + ' ' + x.grade : ''].join(' · '));
      V.tell(c, o.cust, 'Inspection details updated', o.id); c.setState({ drawer: null }); c.commit('Inspection updated');
    } });
};

// ---------- agency inspection report upload ----------
V.uploadReport = (c?: any, o?: any) => {
  const db = c.state.db, key = curKey(o), g = o.sgs;
  if (!o.insp) { c.toast('Book the inspection agency first'); return c.openOrder(o.id); }
  if (!o.insp.res && !g) { c.toast('Record the agency inspection first, then upload its report'); return c.openOrder(o.id); }
  c._rep = c._rep || {};
  const st = c._rep[o.id] = c._rep[o.id] || { file: null };
  const spec = { title: g ? 'Replace inspection report' : 'Upload inspection report', sub: o.id + ' · ' + (o.insp.agency || 'Inspection agency') + ' · ' + o.sell.name, mode: g ? 'Edit' : 'New', perm: 'inspection', cta: g ? 'Save new version' : 'Upload report',
    info: [kv('Report file', st.file ? st.file.name + ' · ' + Math.max(1, Math.round(st.file.size / 1024)) + ' KB' : g && g.file ? g.file + ' (current)' : 'None chosen yet'), kv('Inspected weight', A.qfmt(o.insp.res ? o.insp.res.weight : o.sell.qty, o.sell.unit))],
    fields: [F('no', 'Report / certificate number', g ? g.no : '', 'text', null, 1), F('grade', 'Certified grade', g ? g.grade : String(o.sell.grade || '').replace('~', ''), 'text', null, 1), F('net', 'Certified net quantity (' + o.sell.unit + ')', g ? g.net : (o.insp.res && o.insp.res.weight ? o.insp.res.weight : o.sell.qty), 'num', null, 1), F('result', 'Result', g ? g.result : 'Compliant', 'choice', ['Compliant', 'Compliant with remarks', 'Non-compliant'], 1), F('remarks', 'Agency remarks', g ? g.remarks || '' : '', 'area')],
    sections: [{ title: 'Report file', items: [{ t: st.file ? st.file.name : 'Choose the PDF or scan sent by the agency', s: st.file ? 'Ready to upload' : 'PDF, JPG or PNG', btns: ([{ label: st.file ? 'Change file' : 'Choose file', go: () => V.pick('.pdf,.jpg,.jpeg,.png', false, (fs?: any) => { if (fs[0]) { st.file = fs[0]; V.uploadReport(c, o); c.commit(fs[0].name + ' selected'); } }) }] as any[]).concat(st.file ? [{ label: 'Remove', danger: true, go: () => { st.file = null; V.uploadReport(c, o); c.commit(); } }] : []) }] }],
    save: (x?: any) => {
      if (!st.file && !(g && g.file)) return 'Choose the report file first';
      if (db.live && o.live && V.persistInspectionReport) {
        if (!st.file) return 'Choose the report file first';
        V.persistInspectionReport(c, o, { file: st.file, no: x.no, grade: x.grade, net: x.net, result: x.result, remarks: x.remarks || '' });
        return;
      }
      const fileName = st.file ? st.file.name : g.file, now0 = now(), m = V.me(c);
      if (!g && key === 'sgs') {
        A.stageData(db, o, 'sgs', now0, { no: x.no, grade: x.grade, net: x.net, result: x.result, file: fileName, by: m.name }, false);
        o.hist.push({ at: now0, who: (o.insp.agency || 'Agency') + ' · uploaded by ' + m.name, role: m.label, text: A.SELL[o.stage].label, note: x.result + (x.remarks ? ' · ' + x.remarks : '') });
        o.stage++; o.sAt = now0; V.tell(c, o.cust, 'Inspection report ready to review', o.id);
      } else if (g) {
        g.history = (g.history || []).concat([{ no: g.no, file: g.file, at: g.at }]);
        Object.assign(g, { no: x.no, grade: x.grade, net: x.net, result: x.result, file: fileName, at: now0 });
        db.docs.forEach((d?: any) => { if (d.eid === o.id && /test report|inspection report/i.test(d.type) && d.status === 'issued') d.status = 'replaced'; });
        A.issueDoc(db, 'Test certificate', x.no, 'order', o.id, now0, 'issued', m.name);
        o.hist.push({ at: now0, who: m.name, role: m.label, text: 'Inspection report replaced', note: x.no });
        V.tell(c, o.cust, 'Updated inspection report', o.id);
      } else {
        o.sgs = { agency: o.insp.agency, no: x.no, grade: x.grade, net: x.net, result: x.result, file: fileName, at: now0 };
        A.issueDoc(db, 'Test certificate', x.no, 'order', o.id, now0, 'issued', m.name);
        o.hist.push({ at: now0, who: m.name, role: m.label, text: 'Inspection report uploaded early', note: x.no });
      }
      o.sgs.remarks = x.remarks || ''; if (st.file) o.sgs.fileObj = st.file;
      V.log(c, 'Sell request', o.id, g ? 'Inspection report replaced' : 'Inspection report uploaded', g ? g.no : '', x.no, fileName);
      delete c._rep[o.id]; c.setState({ drawer: null }); c.commit('Report ' + x.no + ' uploaded');
    } };
  const formId = 'rep-' + o.id;
  c._forms = c._forms || {};
  c._forms[formId] = spec;
  const open = c.state.drawer;
  // Re-opening the drawer clears the fields the operator already typed. Refresh in place once it is open.
  if (open && open.type === 'form' && open.id === formId) c.commit();
  else V.form(c, formId, spec);
};
const repBlob = (o?: any) => o.sgs.fileObj || V.pdf('Inspection report · ' + o.sgs.no, ['Agency ' + (o.sgs.agency || ''), 'Request ' + o.id, 'Material ' + o.sell.name, 'Certified grade ' + o.sgs.grade, 'Net ' + A.qfmt(o.sgs.net, o.sell.unit), 'Result ' + o.sgs.result, o.sgs.remarks ? 'Remarks ' + o.sgs.remarks : '', 'Demo file generated by the admin console']);
V.downloadReport = (c?: any, o?: any) => {
  if (o.sgs && o.sgs.liveDoc && o.sgs.docNo && V.downloadDocument) {
    V.downloadDocument(c, { live: true, no: o.sgs.docNo });
    V.log(c, 'Sell request', o.id, 'Inspection report downloaded', '', o.sgs.no);
    return;
  }
  V.download(o.sgs.file || (o.sgs.no + '.pdf'), repBlob(o)); V.log(c, 'Sell request', o.id, 'Inspection report downloaded', '', o.sgs.no); c.commit('Downloaded ' + o.sgs.no);
};

// ---------- seller uploads ----------
const sfiles = (o?: any) => {
  // BUG-011: prefer server-provided files (with url / fileId) over empty placeholders.
  if (Array.isArray(o.sell.files) && o.sell.files.length) return o.sell.files;
  if (Array.isArray(o.sell.photoFileIds) && o.sell.photoFileIds.length) {
    o.sell.files = o.sell.photoFileIds.map((id: string, i: number) => ({
      kind: 'photo',
      name: 'sell-' + A.tail(o.id) + '-photo-' + (i + 1) + '.jpg',
      label: ['Material close-up', 'Full lot', 'Weighing scale reading', 'Bar stamp / markings', 'Storage location', 'Packaging'][i % 6],
      size: '',
      fileId: id,
      url: '/v2/admin/files/' + encodeURIComponent(id) + '/content',
    })).concat((o.sell.docs || []).map((d?: any, i?: any) => ({ kind: 'doc', name: String(d).replace(/[^\w\- ]/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.pdf', label: d, size: (180 + i * 40) + ' KB', url: '' })));
    return o.sell.files;
  }
  if (!o.sell.files) {
    const t = A.tail(o.id);
    o.sell.files = Array.from({ length: o.sell.photos || 0 }, (_, i) => ({ kind: 'photo', name: 'sell-' + t + '-photo-' + (i + 1) + '.jpg', label: ['Material close-up', 'Full lot', 'Weighing scale reading', 'Bar stamp / markings', 'Storage location', 'Packaging'][i % 6], size: (1.2 + i * 0.3).toFixed(1) + ' MB', url: '' }))
      .concat((o.sell.docs || []).map((d?: any, i?: any) => ({ kind: 'doc', name: d.replace(/[^\w\- ]/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.pdf', label: d, size: (180 + i * 40) + ' KB', url: '' })));
  }
  return o.sell.files;
};
V.sfiles = sfiles;
const fileBlob = (o?: any, f?: any) => f.file || V.pdf('Mineral Bridge · seller upload', ['Request ' + o.id, 'File ' + f.name, 'Type ' + (f.kind === 'photo' ? 'Photo' : 'Document') + ' · ' + f.label, 'Material ' + o.sell.name + ' · ' + A.qfmt(o.sell.qty, o.sell.unit), 'Demo file generated by the admin console']);
D.sfile = (c?: any, key?: any) => {
  const [oid, ixs] = String(key).split('|'), i = +(ixs as any), db = c.state.db, o = db.orders.find((x?: any) => x.id === oid);
  if (!o) return { title: 'Request removed', sub: '', fields: [], sections: [], inputs: [], actions: [] };
  const fs = sfiles(o), f = fs[i], cu = A.cust(db, o.cust);
  const acts = [{ label: 'Download', style: V.B[2], go: () => { V.download(f.name, fileBlob(o, f)); V.log(c, 'Sell request', o.id, 'Seller file downloaded', '', f.name); c.commit('Downloaded ' + f.name); } }];
  if (i > 0) acts.push({ label: '‹ Previous', style: V.B[2], go: () => c.openDrawer('sfile', oid + '|' + (i - 1)) });
  if (i < fs.length - 1) acts.push({ label: 'Next ›', style: V.B[2], go: () => c.openDrawer('sfile', oid + '|' + (i + 1)) });
  acts.push(V.act(c, 'Ask seller to re-upload', () => { const r = V.val(c, 'why', ''); if (!r) return c.toast('Say what is wrong with this file'); f.flag = r; o.hist.push({ at: now(), who: V.me(c).name, role: V.me(c).label, text: 'Re-upload requested', note: f.label + ': ' + r }); V.log(c, 'Sell request', o.id, 'Re-upload requested', '', f.name, r); V.tell(c, o.cust, 'Please re-upload ' + f.label, o.id); c.form = {}; c.commit('Re-upload requested from ' + cu.name); }, 2, 'ops'));
  acts.push(V.act(c, 'Attach file for demo', () => V.pick(f.kind === 'photo' ? 'image/*' : '.pdf,image/*', false, (fl?: any) => { const x = fl[0]; if (!x) return; f.file = x; f.name = x.name; f.size = Math.max(1, Math.round(x.size / 1024)) + ' KB'; if (/^image\//.test(x.type)) { const r = new FileReader(); r.onload = () => { f.url = r.result; c.commit(x.name + ' attached'); }; r.readAsDataURL(x); } else c.commit(x.name + ' attached'); }), 2, 'ops'));
  acts.push({ label: 'Close', style: V.B[2], go: () => c.setState({ drawer: null }) });
  return { title: f.label, sub: o.id + ' · ' + cu.name + ' · file ' + (i + 1) + ' of ' + fs.length, pill: f.flag ? 're-upload requested' : f.kind === 'photo' ? 'photo' : 'document', pillStyle: V.pill(f.flag ? 'warn' : 'info'),
    preview: { img: f.url || '', ph: (f.kind === 'photo' ? 'PHOTO · ' : 'PDF · ') + f.label.toUpperCase() + ' · ' + f.name },
    fields: [kv('File', f.name + ' · ' + f.size), kv('Uploaded by', cu.name + ' in the app'), kv('Uploaded', A.fmt(o.at)), kv('Material', o.sell.name + ' · ' + A.qfmt(o.sell.qty, o.sell.unit) + ' · ' + o.sell.grade), kv('Re-upload note', f.flag)],
    sections: [{ title: 'All uploads · ' + fs.length, items: fs.map((x?: any, k?: any) => ({ t: (k === i ? '● ' : '') + x.label, s: x.name, ph: x.url ? '' : (x.kind === 'photo' ? 'IMG' : 'PDF'), img: x.url || '', go: () => c.openDrawer('sfile', oid + '|' + k) })) }],
    inputs: [V.inp(c, 'why', 'What is wrong (if asking for a re-upload)', '', true)], actions: acts };
};

// ---------- customer documents ----------
const cust0 = D.customer;
D.customer = (c?: any, id?: any) => {
  const v = cust0(c, id), db = c.state.db, k = db.kyc.find((z?: any) => z.cust === id);
  if (k) {
    v.sections = [{ title: 'Identity & business documents · ' + k.docs.length, items: k.docs.map((d?: any, i?: any) => { const preview = kycDocPreview(d); return { t: d.label, s: (d.name || '') + (d.note ? ' · ' + d.note : ''), ph: preview.ph, img: preview.img, r: d.status === 'ok' ? 'verified' : d.availability === 'unavailable' ? 'unavailable' : d.status, pill: true, pillStyle: V.pill(d.status === 'ok' ? 'ok' : d.status === 'submitted' ? 'info' : 'warn'), go: () => c.openDrawer('kycDoc', k.ref + '|' + i), btns: [{ label: 'View', go: () => c.openDrawer('kycDoc', k.ref + '|' + i) }] }; }) }].concat(v.sections || []);
    v.actions = [{ label: 'View documents', style: V.B[1], go: () => c.openDrawer('kycDoc', k.ref + '|0') }].concat(v.actions);
  }
  const sells = db.orders.filter((o?: any) => o.cust === id && o.kind === 'sell');
  if (sells.length) v.sections.push({ title: 'Sell request uploads', items: sells.map((o?: any) => ({ t: o.id + ' · ' + o.sell.name, s: (o.sell.photos || 0) + ' photos · ' + (o.sell.docs || []).length + ' documents', go: () => c.openDrawer('sfile', o.id + '|0') })) });
  return v;
};

// ---------- order detail: uploads, inspection edit, negotiation ----------
const negoOk = (o?: any) => !o.rejected && !A.nextInfo(o).done && ((o.hold && o.hold.t === 'declined') || (!o.hold && ['quote', 'quoteOk'].indexOf(curKey(o)) >= 0));
V.revise = (c?: any, o?: any, total?: any, note?: any) => {
  const db = c.state.db, q = o.quotes[o.quotes.length - 1], p: any = { by: V.me(c).name, otherLabel: q && q.otherLabel, market: (q && q.market) || '' };
  if (o.kind === 'buy') {
    const fee = q ? q.fee || 0 : 0, tr = q ? q.transport || 0 : 0, oth = q ? q.other || 0 : 0, prodWant = total - fee - tr - oth;
    if (prodWant <= 0) return 'That total is lower than the fees and transport on the quote';
    const prod = q ? q.prod : 0;
    o.items.forEach((it?: any, i?: any) => { const base = q && q.lines[i] ? q.lines[i].price : prodWant / o.items.length; p['price' + i] = Math.round(prod ? base * prodWant / prod : prodWant / o.items.length); p['price_' + i] = Math.round((prod ? base * prodWant / prod : prodWant / o.items.length) / it.qty); });
    p.fee = fee; p.transport = tr; p.other = oth;
  } else { const ded = q ? q.deduct || 0 : 0; p.deduct = ded; p.unitPrice = (total + ded) / o.sell.qty; p.offer = total; }
  A.stageData(db, o, 'quote', now(), p, false); const held = !!o.hold;
  o.hold = null; o.stage = ix(o, 'quoteOk'); o.sAt = now();
  o.hist.push({ at: now(), who: V.me(c).name, role: V.me(c).label, text: 'Revised quotation issued', note: note || 'Agreed in negotiation' });
  V.log(c, o.kind === 'buy' ? 'Order' : 'Sell request', o.id, 'Revised quotation issued', '', A.money(o.total), note);
  V.tell(c, o.cust, 'Revised quotation ' + A.money(o.total), o.id);
  if (o.live && held && V.persistOrderHold) V.persistOrderHold(c, o, { clear: true, reason: 'Revised quotation issued · ' + A.money(o.total) + (note ? ' · ' + note : '') });
  return '';
};
const negoSeed = (db?: any, o?: any) => {
  if (o.nego) return o.nego;
  o.nego = [];
  const q = o.quotes[o.quotes.length - 1]; if (!q || o.src !== 'direct') return o.nego;
  const cu = A.cust(db, o.cust), first = cu.name.split(' ')[0];
  o.nego.push({ from: 'admin', who: 'Tunde Adebayo', text: 'Hi ' + first + ', quotation ' + q.no + ' is ready at ' + A.money(q.total) + ', priced from today’s market rate.', at: q.at, offer: 0 });
  if (o.hold && o.hold.t === 'declined') o.nego.push({ from: 'cust', who: cu.name, text: 'That is about 3% above our budget this quarter. Could you do this instead?', at: o.hold.at, offer: Math.round(q.total * 0.97 / 100) * 100 });
  else if (curKey(o) === 'quoteOk') o.nego.push({ from: 'cust', who: cu.name, text: o.kind === 'sell' ? 'The market moved up since you quoted. We would accept this:' : 'Can you hold this price until Friday? We are close to confirming.', at: o.sAt + 18e5, offer: o.kind === 'sell' ? Math.round(q.total * 1.04 / 100) * 100 : 0 });
  return o.nego;
};
const od0 = V.orderDetail;
V.orderDetail = (c?: any, o?: any) => {
  const out = od0(c, o), db = c.state.db;
  // uploads card for sell requests
  if (o.kind === 'sell') {
    const fs = sfiles(o);
    out.cards.splice(1, 0, { title: 'Seller uploads · ' + fs.filter((f?: any) => f.kind === 'photo').length + ' photos · ' + fs.filter((f?: any) => f.kind === 'doc').length + ' documents', rows: [], hasList: true,
      list: fs.map((f?: any, i?: any) => ({ t: (f.kind === 'photo' ? 'Photo · ' : 'Document · ') + f.label, s: f.name + (f.flag ? ' · re-upload requested' : ''), r: 'View', go: () => c.openDrawer('sfile', o.id + '|' + i), style: 'display:flex; align-items:center; gap:12px; padding:9px 0; border-top:1px solid var(--line2); cursor:pointer;' })) });
  }
  // inspection editing
  if (o.kind === 'sell' && o.insp) {
    out.manage = (out.manage || []).filter((a?: any) => a.label !== 'Edit inspection');
    out.manage.unshift(V.act(c, 'Edit inspection', () => V.editInsp(c, o), 2, 'inspection'));
    if (o.sgs) { out.manage.unshift(V.act(c, 'Replace inspection report', () => V.uploadReport(c, o), 2, 'inspection')); out.manage.unshift({ label: 'Download inspection report', style: V.B[2], go: () => V.downloadReport(c, o) }); }
    else if (o.insp.res) out.manage.unshift(V.act(c, 'Upload inspection report', () => V.uploadReport(c, o), 1, 'inspection'));
    out.hasManage = true;
    if (curKey(o) === 'sgs' && !o.hold && out.next) { out.next.fields = []; out.next.hasFields = false; out.next.note = 'The agency sends its report and test certificate. Upload the file to record it.'; out.next.hasNote = true; out.next.acts = [V.act(c, 'Upload inspection report', () => V.uploadReport(c, o), 1, 'inspection')].concat(out.next.acts.filter((b?: any) => /Remind|Simulate/.test(b.label))); }
  }
  // negotiation
  const msgs = negoSeed(db, o), cu = A.cust(db, o.cust), can = negoOk(o);
  const last = msgs[msgs.length - 1];
  const acts = [];
  acts.push(V.act(c, 'Send', () => {
    const t = (c.form.ng_text || '').trim(), off = +(c.form.ng_offer || '');
    if (!t && !off) return c.toast('Write a message or enter a counter-offer');
    if (off && !can) return c.toast('The price is already agreed — counter-offers are closed for this ' + (o.kind === 'buy' ? 'order' : 'request'));
    if (off && !(off > 0)) return c.toast('Enter a valid amount');
    msgs.push({ from: 'admin', who: V.me(c).name, text: t || 'Counter-offer', at: now(), offer: off || 0 });
    if (off) { const e = V.revise(c, o, off, 'Counter-offer from Mineral Bridge'); if (e) { msgs.pop(); return c.toast(e); } }
    else V.tell(c, o.cust, 'New message about ' + o.id, o.id);
    c.form.ng_text = ''; c.form.ng_offer = ''; c._ngK = (c._ngK || 0) + 1; c.commit(off ? 'Counter-offer sent as revised quotation' : 'Message sent');
  }, 1, 'trading'));
  if (can && last && last.from === 'cust' && last.offer) acts.push(V.act(c, 'Accept ' + A.money(last.offer), () => { const e = V.revise(c, o, last.offer, 'Accepted customer offer'); if (e) return c.toast(e); msgs.push({ from: 'admin', who: V.me(c).name, text: 'Agreed. Revised quotation issued at ' + A.money(last.offer) + '.', at: now(), offer: 0 }); c.commit('Offer accepted · revised quotation sent'); }, 4, 'trading'));
  if (can) acts.push({ label: 'Simulate customer reply', style: V.B[2], go: () => { const off = Math.round(o.total * (o.kind === 'sell' ? 1.03 : 0.97) / 100) * 100; msgs.push({ from: 'cust', who: cu.name, text: o.kind === 'sell' ? 'We can sell at this price if you agree today.' : 'We can confirm today at this price.', at: now(), offer: off }); c.commit('Customer replied'); } });
  out.hasNego = o.src === 'direct' && (o.quotes.length > 0 || ['quote'].indexOf(curKey(o)) >= 0);
  out.nego = {
    key: o.id + '-' + msgs.length + '-' + (c._ngK || 0), count: msgs.length + ' message' + (msgs.length === 1 ? '' : 's'),
    current: o.total ? 'Current quotation ' + A.money(o.total) + (can ? ' · open to negotiate' : ' · price agreed') : 'No quotation yet — send the first offer below',
    empty: !msgs.length,
    msgs: msgs.map((m?: any) => ({ text: m.text, meta: (m.from === 'cust' ? m.who : m.who + ' · Mineral Bridge') + ' · ' + A.fmt(m.at), hasOffer: !!m.offer, offer: (m.from === 'cust' ? 'Customer offer ' : 'Counter-offer ') + A.money(m.offer || 0),
      wrap: 'display:flex; flex-direction:column; gap:3px; max-width:88%; align-self:' + (m.from === 'cust' ? 'flex-start' : 'flex-end') + ';',
      bubble: 'padding:9px 12px; border-radius:13px; font-size:12px; font-weight:600; line-height:1.5; display:flex; flex-direction:column; gap:5px; ' + (m.from === 'cust' ? 'background:var(--soft); color:var(--ink); border:1px solid var(--line); border-bottom-left-radius:4px;' : 'background:var(--btn); color:#fff; border-bottom-right-radius:4px;'),
      offerStyle: 'display:inline-flex; align-self:flex-start; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:800; ' + (m.from === 'cust' ? 'background:var(--goldBg); color:var(--goldInk);' : 'background:rgba(255,255,255,.18); color:#fff;'),
      metaStyle: 'font-size:10.5px; font-weight:600; color:var(--ink3); text-align:' + (m.from === 'cust' ? 'left' : 'right') + ';' })),
    setText: (e?: any) => { c.form.ng_text = e.target.value; }, setOffer: (e?: any) => { c.form.ng_offer = e.target.value; },
    offerHint: can ? 'Counter-offer total ($) — sends a revised quotation' : 'Price agreed — counter-offers closed',
    acts
  };
  return out;
};

// ---------- auto-create a draft lot when a sell request reaches the vault ----------
const sd0 = A.stageData;
A.stageData = function (db?: any, o?: any, key?: any, at?: any, p?: any, seed?: any) {
  // eslint-disable-next-line prefer-rest-params -- kept as in the design source
  const r = sd0.apply(this, arguments);
  if (!seed && key === 'received' && o.kind === 'sell' && !o.vaultLot) {
    let n = 9000; db.lots.forEach((l?: any) => { const k = +String(l.id).replace(/\D/g, ''); if (/^V-/.test(l.id) && k >= n) n = k + 1; });
    const l = { id: 'V-' + n, mineral: o.sell.mineral, name: o.sell.name + ' · from ' + o.id, form: o.sell.form, avail: o.vault ? o.vault.weight : o.sell.qty, unit: o.sell.unit, min: 0, grade: o.sgs ? o.sgs.grade : o.sell.grade, lab: o.sgs ? o.sgs.agency : '', cert: o.sgs ? o.sgs.no : '', origin: A.SITES[o.cust] || '', ref: 0, status: 'draft', images: 0, docs: o.sgs ? ['Test report ' + o.sgs.no + '.pdf'] : [], reserved: 0 };
    db.lots.unshift(l); o.vaultLot = l.id;
    V.moves(db).unshift({ at, lot: l.id, delta: l.avail, type: 'Received at vault', ref: o.id, by: (p && p.by) || 'System', note: 'Draft lot created from the sell request' });
  }
  return r;
};

// ---------- stock movements ----------
V.moves = (db?: any) => {
  if (db.moves) return db.moves;
  const mv: any[] = [];
  db.orders.forEach((o?: any) => {
    if (o.kind === 'buy' && o.stage > 1 && !o.rejected) o.items.forEach((it?: any) => { const h = o.hist.find((x?: any) => /accepted|Won at auction/.test(x.text)) || { at: o.at, who: 'System' }; mv.push({ at: h.at, lot: it.lot, delta: -it.qty, type: A.nextInfo(o).done ? 'Sold' : 'Reserved for order', ref: o.id, by: h.who, note: '' }); });
    if (o.kind === 'sell' && o.vault) mv.push({ at: o.vault.at, lot: '', delta: o.vault.weight, type: 'Received at vault', ref: o.id, by: 'Kelechi Nwosu', note: o.sell.name + ' · ' + A.qfmt(o.vault.weight, o.sell.unit) });
  });
  db.lots.forEach((l?: any, i?: any) => mv.push({ at: now() - (30 + i) * A.D, lot: l.id, delta: l.avail + db.orders.filter((o?: any) => o.kind === 'buy' && o.stage > 1 && !o.rejected).reduce((s?: any, o?: any) => s + o.items.filter((x?: any) => x.lot === l.id).reduce((a?: any, x?: any) => a + x.qty, 0), 0), type: 'Opening stock', ref: '', by: 'Ifeoma Uche', note: 'Count at go-live' }));
  db.moves = mv.sort((a, b) => b.at - a.at);
  return db.moves;
};
const stockOf = (db?: any, l?: any) => {
  const open = db.orders.filter((o?: any) => o.kind === 'buy' && o.stage > 1 && !o.rejected && !A.nextInfo(o).done), done = db.orders.filter((o?: any) => o.kind === 'buy' && !o.rejected && A.nextInfo(o).done && o.stage > 1);
  const sum = (list?: any) => list.reduce((s?: any, o?: any) => s + o.items.filter((x?: any) => x.lot === l.id).reduce((a?: any, x?: any) => a + x.qty, 0), 0);
  const reserved = +sum(open).toFixed(3), sold = +sum(done).toFixed(3);
  const inAuction = db.auctions.filter((a?: any) => a.lot === l.id && ['Live', 'Upcoming', 'Paused'].indexOf(V.auSt(a, now())) >= 0).reduce((s?: any, a?: any) => s + a.qty, 0);
  return { reserved, sold, inAuction, onHand: +(l.avail + reserved).toFixed(3), low: l.avail > 0 && l.min && l.avail < l.min * 2, out: l.avail <= 0 };
};
V.adjustStock = (c?: any, l?: any) => {
  const db = c.state.db;
  V.form(c, 'adj-' + l.id, { title: 'Adjust stock · ' + l.id, sub: l.name + ' · ' + A.qfmt(l.avail, l.unit) + ' available now', mode: 'Edit', perm: 'catalogue', cta: 'Save adjustment',
    fields: [F('type', 'Adjustment', 'add', 'choice', [['add', 'Add stock (received into vault)'], ['remove', 'Remove (damaged, lost or sampled)'], ['count', 'Set to a counted amount']], 1), F('qty', 'Quantity (' + l.unit + ')', '', 'num', null, 1), F('note', 'Reason', '', 'area', null, 1)],
    save: (x?: any) => {
      const before = l.avail; let nv = x.type === 'add' ? l.avail + x.qty : x.type === 'remove' ? l.avail - x.qty : x.qty;
      if (nv < 0) return 'You cannot remove more than the ' + A.qfmt(l.avail, l.unit) + ' available';
      if (l.live && V.persistStock) { if (!String(x.note || '').trim()) return 'Say why the stock changed'; V.persistStock(c, l, { type: x.type, qty: x.qty, note: String(x.note).trim() }); c.setState({ drawer: null }); return; }
      nv = +nv.toFixed(3); l.avail = nv; if (nv === 0 && l.status === 'listed') l.status = 'sold out'; if (nv > 0 && l.status === 'sold out') l.status = 'listed';
      V.moves(db).unshift({ at: now(), lot: l.id, delta: +(nv - before).toFixed(3), type: ({ add: 'Stock added', remove: 'Stock removed', count: 'Count corrected' } as any)[x.type], ref: '', by: V.me(c).name, note: x.note });
      V.log(c, 'Lot', l.id, 'Stock adjusted', A.qfmt(before, l.unit), A.qfmt(nv, l.unit), x.note);
      c.setState({ drawer: null }); c.commit(l.id + ' now ' + A.qfmt(nv, l.unit));
    } });
};
D.stock = (c?: any, id?: any) => {
  const db = c.state.db, l = A.lot(db, id), s = stockOf(db, l), mv = V.moves(db).filter((m?: any) => m.lot === id);
  const open = db.orders.filter((o?: any) => o.kind === 'buy' && o.stage > 1 && !o.rejected && !A.nextInfo(o).done && o.items.some((x?: any) => x.lot === id));
  return { title: l.name, sub: l.id + ' · ' + l.origin, pill: s.out ? 'out of stock' : s.low ? 'low stock' : 'in stock', pillStyle: V.pill(s.out ? 'err' : s.low ? 'warn' : 'ok'),
    fields: [kv('On hand in vault', A.qfmt(s.onHand, l.unit)), kv('Reserved for open orders', A.qfmt(s.reserved, l.unit)), kv('In live or upcoming auctions', A.qfmt(s.inAuction, l.unit)), kv('Available to sell', A.qfmt(l.avail, l.unit)), kv('Sold to date', A.qfmt(s.sold, l.unit)), kv('Minimum order', A.qfmt(l.min, l.unit)), kv('Catalogue status', l.status)],
    sections: [{ title: 'Reserved by', items: open.map((o?: any) => ({ t: o.id, s: A.cname(A.cust(db, o.cust)) + ' · ' + A.nextInfo(o).label, r: A.qfmt(o.items.find((x?: any) => x.lot === id).qty, l.unit), go: () => c.openOrder(o.id) })) }, { title: 'Movements · ' + mv.length, items: mv.slice(0, 30).map((m?: any) => ({ t: m.type + ' · ' + (m.delta > 0 ? '+' : '') + A.qfmt(m.delta, l.unit), s: A.fmt(m.at) + ' · ' + m.by + (m.ref ? ' · ' + m.ref : '') + (m.note ? ' · ' + m.note : ''), go: m.ref && db.orders.some((o?: any) => o.id === m.ref) ? () => c.openOrder(m.ref) : null })) }],
    inputs: [], actions: [V.act(c, 'Adjust stock', () => V.adjustStock(c, l), 1, 'catalogue'), { label: 'Open lot', style: V.B[2], go: () => c.openDrawer('lot', id) }] };
};

// ---------- new pages: All orders, Inventory ----------
const page0 = V.page;
V.page = (c?: any) => {
  const nav = c.state.nav, db = c.state.db;
  if (nav === 'buy') {
    const all = db.orders, keep = db.orders.filter((o?: any) => !(o.kind === 'buy' && o.src !== 'direct'));
    db.orders = keep;
    let out; try { out = page0(c); } finally { db.orders = all; }
    if (out) { out.hasChipsOrTools = out.hasChips || out.hasTools; out.hasTable = !!out.table; if (out.table) out.table.note = 'Auction purchases are tracked under Auctions and All orders.'; }
    return out;
  }
  if (nav === 'orders') {
    const out: any = { tabs: [], hasTabs: false, chips: [], hasChips: true, table: null, kpis: [], hasKpis: false, minis: [], hasMinis: false, settings: null, isSettings: false, tools: [V.act(c, 'New buy order', () => V.newBuy(c), 1, 'ops'), V.act(c, 'New sell request', () => V.newSell(c), 2, 'ops')], hasTools: true };
    const type = (o?: any) => o.kind === 'sell' ? 'Sell' : o.src !== 'direct' ? 'Auction' : 'Buy';
    const labels = ['All', 'Buy', 'Sell', 'Auction', 'Needs Mineral Bridge', 'Waiting on customer', 'On hold', 'Completed'];
    const test = (o?: any, l?: any) => l === 'All' || l === type(o) || V.orderChip(o, l);
    const ch = V.chips(c, 'allord', labels, labels.map(l => db.orders.filter((o?: any) => test(o, l)).length));
    out.chips = ch.list;
    const list = db.orders.filter((o?: any) => test(o, ch.cur) && V.match(c, [o.id, A.cust(db, o.cust).name, A.cust(db, o.cust).business, V.itemsText(db, o), A.nextInfo(o).label, o.src, type(o)])).sort((a?: any, b?: any) => b.at - a.at);
    const cols = V.orderCols('buy').slice(); cols.splice(1, 0, ['TYPE', '.6fr', (o?: any) => type(o)]); cols[0] = ['RECORD', '1.25fr', (o?: any) => o.id];
    out.table = V.table(c, 'allord', cols, list, (o?: any) => { const r = V.orderRow(c, o); r.cells.splice(1, 0, { t: type(o), pill: type(o) === 'Sell' ? 'gold' : type(o) === 'Auction' ? 'info' : 'mute' }); return r; });
    out.hasTable = true; out.hasChipsOrTools = true;
    return out;
  }
  if (nav === 'inventory') {
    const out: any = { tabs: [], hasTabs: false, chips: [], hasChips: true, table: null, kpis: [], hasKpis: true, minis: [], hasMinis: false, settings: null, isSettings: false, tools: [{ label: 'Export stock CSV', style: V.B[2], go: () => { const rows = [['lot', 'name', 'unit', 'on_hand', 'reserved', 'in_auction', 'available', 'sold', 'status']].concat(db.lots.map((l?: any) => { const s = stockOf(db, l); return [l.id, l.name, l.unit, s.onHand, s.reserved, s.inAuction, l.avail, s.sold, l.status]; })); V.download('mineral-bridge-stock-' + new Date().toISOString().slice(0, 10) + '.csv', rows.map(r => r.map(x => /[",]/.test(String(x)) ? '"' + String(x).replace(/"/g, '""') + '"' : x).join(',')).join('\n'), 'text/csv'); c.toast('Stock exported'); } }], hasTools: true };
    V.moves(db);
    const S = db.lots.map((l?: any) => ({ l, s: stockOf(db, l) }));
    const card = (label?: any, value?: any, sub?: any, tone?: any, go?: any, i?: any) => ({ label, value: String(value), sub, go, subStyle: 'font-size:11.5px; font-weight:700; color:var(--' + tone + 'Ink);', style: 'display:flex; flex-direction:column; gap:8px; padding:16px 18px; border-radius:18px; border:1px solid var(--line); background:var(--card); box-shadow:var(--shadow); cursor:pointer; text-align:left; animation:mbUp .35s ' + (i * 0.04).toFixed(2) + 's backwards ease;' });
    const setChip = (l?: any) => () => c.setState((st?: any) => ({ chip: Object.assign({}, st.chip, { inv: l }) }));
    out.kpis = [card('LOTS IN STOCK', S.filter((x?: any) => !x.s.out).length, 'of ' + S.length + ' lots', 'ok', setChip('In stock'), 0), card('LOW STOCK', S.filter((x?: any) => x.s.low).length, 'Under 2× the minimum order', 'warn', setChip('Low stock'), 1), card('OUT OF STOCK', S.filter((x?: any) => x.s.out).length, 'Nothing left to sell', 'err', setChip('Out of stock'), 2), card('RESERVED FOR ORDERS', S.filter((x?: any) => x.s.reserved > 0).length + ' lots', db.orders.filter((o?: any) => o.kind === 'buy' && o.stage > 1 && !o.rejected && !A.nextInfo(o).done).length + ' open orders', 'info', setChip('Reserved'), 3)];
    const labels = ['All', 'In stock', 'Low stock', 'Out of stock', 'Reserved', 'In auction'];
    const test = (x?: any, l?: any) => l === 'All' || (l === 'In stock' && !x.s.out) || (l === 'Low stock' && x.s.low) || (l === 'Out of stock' && x.s.out) || (l === 'Reserved' && x.s.reserved > 0) || (l === 'In auction' && x.s.inAuction > 0);
    const ch = V.chips(c, 'inv', labels, labels.map(l => S.filter((x?: any) => test(x, l)).length));
    out.chips = ch.list;
    const list = S.filter((x?: any) => test(x, ch.cur) && V.match(c, [x.l.id, x.l.name, x.l.mineral, x.l.origin]));
    out.table = V.table(c, 'inv', [['LOT', '.8fr', (x?: any) => x.l.id], ['MATERIAL', '1.6fr', (x?: any) => x.l.name], ['ON HAND', '.9fr', (x?: any) => x.s.onHand], ['RESERVED', '.9fr', (x?: any) => x.s.reserved], ['IN AUCTION', '.8fr', (x?: any) => x.s.inAuction], ['AVAILABLE', '.9fr', (x?: any) => x.l.avail], ['SOLD', '.8fr', (x?: any) => x.s.sold], ['STOCK', '.9fr'], ['', '170px', null, 1]], list, (x?: any) => {
      const l = x.l, s = x.s;
      return { hl: s.low || s.out, cells: [{ t: l.id, id: 1 }, { t: l.name, s: l.status + ' · min ' + A.qfmt(l.min, l.unit) }, { t: A.qfmt(s.onHand, l.unit), b: 1 }, { t: A.qfmt(s.reserved, l.unit), tone: s.reserved ? 'warn' : null }, { t: A.qfmt(s.inAuction, l.unit) }, { t: A.qfmt(l.avail, l.unit), b: 1, tone: s.out ? 'err' : null }, { t: A.qfmt(s.sold, l.unit) }, { t: s.out ? 'Out' : s.low ? 'Low' : 'OK', pill: s.out ? 'err' : s.low ? 'warn' : 'ok' }, { t: '', btns: [{ label: 'Adjust', go: () => V.can(c, 'catalogue') ? V.adjustStock(c, l) : c.toast('Needs Catalogue manager') }, { label: 'History', go: () => c.openDrawer('stock', l.id) }] }], go: () => c.openDrawer('stock', l.id) };
    }, { empty: 'No lots match this filter.' });
    out.hasTable = true; out.hasChipsOrTools = true;
    return out;
  }
  return page0(c);
};
V.v5Ready = true;

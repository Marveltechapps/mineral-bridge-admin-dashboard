/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported from the design file mb-admin-cats.js. Behaviour and styles are kept as designed.
import { MBA, MBV } from './registry';

const V = MBV, D = V.D || {};
const slug = (s?: any) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
V.cats = (db?: any) => {
  if (!db.cats) db.cats = MBA.CATS.map((c?: any) => ({ id: c[0], label: c[1], active: true, subs: c[2].map((s?: any) => ({ id: s[0], label: s[1], active: true })) }));
  return db.cats;
};
V.subOf = (db?: any, mineral?: any) => { for (const c of V.cats(db)) { const s = c.subs.find((x?: any) => x.id === mineral); if (s) return { cat: c, sub: s }; } return null; };
const lotsIn = (db?: any, ids?: any) => db.lots.filter((l?: any) => ids.indexOf(l.mineral) >= 0);
V.catTable = (c?: any) => {
  const db = c.state.db, cats = V.cats(db);
  const list = cats.filter((k?: any) => V.match(c, [k.label, k.id].concat(k.subs.map((s?: any) => s.label))));
  return V.table(c, 'cats', [['CATEGORY', '1.3fr', (k?: any) => k.label], ['SUBCATEGORIES', '2.6fr'], ['LOTS', '.6fr', (k?: any) => lotsIn(db, k.subs.map((s?: any) => s.id)).length], ['LISTED', '.6fr'], ['STATUS', '.7fr', (k?: any) => k.active ? 1 : 0]], list, (k?: any) => {
    const lots = lotsIn(db, k.subs.map((s?: any) => s.id));
    return { cells: [{ t: k.label, s: k.id, b: 1 }, { t: k.subs.map((s?: any) => s.label + (s.active ? '' : ' (off)')).join(', '), s: k.subs.length + ' subcategories' }, { t: lots.length }, { t: lots.filter((l?: any) => l.status === 'listed').length }, { t: k.active ? 'Shown in app' : 'Hidden', pill: k.active ? 'ok' : 'mute' }], go: () => c.openDrawer('cat', k.id) };
  }, { empty: 'No categories match this search.' });
};
D.cat = (c?: any, id?: any) => {
  const db = c.state.db, k = V.cats(db).find((x?: any) => x.id === id);
  if (!k) return { title: 'Category removed', sub: '', fields: [], sections: [], inputs: [], actions: [] };
  const lots = lotsIn(db, k.subs.map((s?: any) => s.id)), acts = [];
  acts.push(V.act(c, 'Save name', () => { const n = V.val(c, 'label', k.label).trim(); if (!n) return c.toast('Name the category'); if (n === k.label) return c.toast('No changes'); V.log(c, 'Category', k.id, 'Category renamed', k.label, n); k.label = n; c.form = {}; c.commit('Category renamed to ' + n); if (db.live && V.persistCategory) V.persistCategory(c, 'rename', k, { name: n }); }, 1, 'catalogue'));
  acts.push(V.act(c, 'Add subcategory', () => { const n = V.val(c, 'sub', '').trim(); if (!n) return c.toast('Type a subcategory name'); const sid = slug(n); if (V.subOf(db, sid)) return c.toast('A subcategory with that name already exists'); k.subs.push({ id: sid, label: n, active: true }); V.log(c, 'Category', k.id, 'Subcategory added', '', n); c.form = {}; c.commit(n + ' added to ' + k.label); if (db.live && V.persistSubcategory) V.persistSubcategory(c, 'create', k, { id: sid, label: n, active: true }); }, 2, 'catalogue'));
  acts.push(V.act(c, k.active ? 'Hide in app' : 'Show in app', () => { k.active = !k.active; V.log(c, 'Category', k.id, k.active ? 'Shown in app' : 'Hidden in app'); c.commit(k.label + (k.active ? ' is shown in the app' : ' is hidden — its lots stay in the admin')); if (db.live && V.persistCategory) V.persistCategory(c, 'visibility', k, { active: k.active }); }, k.active ? 3 : 4, 'catalogue'));
  acts.push(V.act(c, 'Delete category', () => { if (lots.length) return c.toast('Move or archive its ' + lots.length + ' lots first'); db.cats.splice(db.cats.indexOf(k), 1); V.log(c, 'Category', k.id, 'Category deleted', k.label, ''); c.setState({ drawer: null }); c.commit(k.label + ' deleted'); if (db.live && V.persistCategory) V.persistCategory(c, 'delete', k); }, 3, 'catalogue'));
  return { title: k.label, sub: 'Category · ' + k.subs.length + ' subcategories · ' + lots.length + ' lots', pill: k.active ? 'shown in app' : 'hidden', pillStyle: V.pill(k.active ? 'ok' : 'mute'),
    fields: [{ k: 'Key', v: k.id }, { k: 'Lots listed', v: String(lots.filter((l?: any) => l.status === 'listed').length) }],
    sections: [{ title: 'Subcategories · click to edit', items: k.subs.map((s?: any) => { const n = lotsIn(db, [s.id]).length; return { t: s.label, s: s.id + ' · ' + n + ' lot' + (n === 1 ? '' : 's'), r: s.active ? 'On' : 'Off', pill: true, pillStyle: V.pill(s.active ? 'ok' : 'mute'), go: () => c.openDrawer('sub', s.id) }; }) }],
    inputs: [V.inp(c, 'label', 'Category name', k.label), V.inp(c, 'sub', 'New subcategory name', '')], actions: acts };
};
D.sub = (c?: any, id?: any) => {
  const db = c.state.db, f = V.subOf(db, id);
  if (!f) return { title: 'Subcategory removed', sub: '', fields: [], sections: [], inputs: [], actions: [] };
  const k = f.cat, s = f.sub, lots = lotsIn(db, [s.id]), acts = [];
  acts.push(V.act(c, 'Save name', () => { const n = V.val(c, 'label', s.label).trim(); if (!n) return c.toast('Name the subcategory'); if (n === s.label) return c.toast('No changes'); V.log(c, 'Category', s.id, 'Subcategory renamed', s.label, n); s.label = n; c.form = {}; c.commit('Renamed to ' + n); if (db.live && V.persistSubcategory) V.persistSubcategory(c, 'rename', k, s, { name: n }); }, 1, 'catalogue'));
  acts.push(V.act(c, 'Move', () => { const to = V.val(c, 'move', '').trim().toLowerCase(); const dst = V.cats(db).find((x?: any) => x.label.toLowerCase() === to || x.id === to); if (!dst) return c.toast('No category called "' + to + '"'); if (dst === k) return c.toast('Already in ' + k.label); k.subs.splice(k.subs.indexOf(s), 1); dst.subs.push(s); V.log(c, 'Category', s.id, 'Subcategory moved', k.label, dst.label); c.form = {}; c.commit(s.label + ' moved to ' + dst.label); if (db.live && V.persistSubcategory) V.persistSubcategory(c, 'move', k, s, { categorySlug: dst.id }); }, 2, 'catalogue'));
  acts.push(V.act(c, s.active ? 'Turn off' : 'Turn on', () => { s.active = !s.active; V.log(c, 'Category', s.id, s.active ? 'Subcategory on' : 'Subcategory off'); c.commit(s.label + (s.active ? ' is on' : ' is off — sellers can no longer pick it')); if (db.live && V.persistSubcategory) V.persistSubcategory(c, 'visibility', k, s, { active: s.active }); }, s.active ? 3 : 4, 'catalogue'));
  acts.push(V.act(c, 'Delete', () => { if (lots.length) return c.toast('Move or archive its ' + lots.length + ' lots first'); k.subs.splice(k.subs.indexOf(s), 1); V.log(c, 'Category', s.id, 'Subcategory deleted', s.label, ''); c.openDrawer('cat', k.id); c.commit(s.label + ' deleted'); if (db.live && V.persistSubcategory) V.persistSubcategory(c, 'delete', k, s); }, 3, 'catalogue'));
  acts.push({ label: 'Back to ' + k.label, style: V.B[2], go: () => c.openDrawer('cat', k.id) });
  return { title: s.label, sub: 'Subcategory of ' + k.label, pill: s.active ? 'on' : 'off', pillStyle: V.pill(s.active ? 'ok' : 'mute'),
    fields: [{ k: 'Key', v: s.id }, { k: 'Category', v: k.label }, { k: 'Lots', v: String(lots.length) }],
    sections: [{ title: 'Lots', items: lots.map((l?: any) => ({ t: l.id + ' · ' + l.name, s: l.status + ' · ' + MBA.qfmt(l.avail, l.unit), go: () => c.openDrawer('lot', l.id) })) }],
    inputs: [V.inp(c, 'label', 'Subcategory name', s.label), V.inp(c, 'move', 'Move to category (type its name)', '')], actions: acts };
};
D.newCat = (c?: any) => ({ title: 'New category', sub: 'Shown in the app once it has at least one subcategory', fields: [], sections: [],
  inputs: [V.inp(c, 'label', 'Category name', ''), V.inp(c, 'subs', 'Subcategories, comma separated', '')],
  actions: [V.act(c, 'Create category', () => { const db = c.state.db, n = V.val(c, 'label', '').trim(); if (!n) return c.toast('Name the category'); const id = slug(n); if (V.cats(db).some((x?: any) => x.id === id)) return c.toast('That category already exists'); const subs = V.val(c, 'subs', '').split(',').map((x?: any) => x.trim()).filter(Boolean); const dup = subs.find((x?: any) => V.subOf(db, slug(x))); if (dup) return c.toast(dup + ' already exists in another category'); db.cats.push({ id, label: n, active: subs.length > 0, subs: subs.map((x?: any) => ({ id: slug(x), label: x, active: true })) }); V.log(c, 'Category', id, 'Category created', '', n); c.form = {}; c.commit(n + ' created'); if (db.live && V.persistCategory) { V.persistCategory(c, 'create', { id, label: n, active: subs.length > 0 }, { name: n, subcategories: subs }); return; } c.openDrawer('cat', id); }, 1, 'catalogue')] });
// wrap lot drawers so category is shown and validated
const lotD = D.lot, newLotD = D.newLot;
D.lot = (c?: any, id?: any) => { const v = lotD(c, id), l = MBA.lot(c.state.db, id), f = V.subOf(c.state.db, l.mineral); v.sub = l.id + ' · ' + (f ? f.cat.label + ' › ' + f.sub.label : 'No category') + ' · ' + l.origin; return v; };
D.newLot = (c?: any) => { const v = newLotD(c), act = v.actions[0], go = act.go; const opts = V.cats(c.state.db).filter((k?: any) => k.active).map((k?: any) => k.subs.filter((s?: any) => s.active).map((s?: any) => s.id).join(', ')).join(' · '); v.inputs[1] = V.inp(c, 'mineral', 'Subcategory key (' + opts + ')', 'gold'); act.go = () => { const f = V.subOf(c.state.db, V.val(c, 'mineral', 'gold')); if (!f || !f.sub.active || !f.cat.active) return c.toast('Pick an active subcategory key'); go(); }; return v; };

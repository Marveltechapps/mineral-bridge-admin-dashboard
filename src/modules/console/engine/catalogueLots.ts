/* eslint-disable @typescript-eslint/no-explicit-any */
// Select all and bulk delete for Catalogue → Lots → Lots listed for buyers.
import { adminApi, AdminApiError } from '../../../lib/adminApi';
import { getConsoleDb } from '../../../services/console/consoleService';
import { MBV } from './registry';

const V = MBV;

type PickState = { ids: Record<string, true>; busy: boolean; pending: string[] };

function pick(c: any): PickState {
  if (!c.lotPick) c.lotPick = { ids: {}, busy: false, pending: [] };
  return c.lotPick as PickState;
}

function isLotsScreen(c: any): boolean {
  return c?.state?.nav === 'catalogue' && (c.state.tab?.catalogue || 'Lots') === 'Lots';
}

function selectedIds(c: any): string[] {
  const chosen = pick(c).ids;
  const live = new Set<string>();
  for (const lot of c.state?.db?.lots || []) {
    if (lot?.id) live.add(String(lot.id));
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of Object.keys(chosen)) {
    if (!live.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function scopeText(c: any, count: number): string {
  const chip = c.state?.chip?.lots || 'All';
  const q = String(c.state?.q || '').trim();
  if (chip === 'All' && !q) return `Select all applies to all ${count} catalogue lots, on every page`;
  if (!q) return `Select all applies to all ${count} ${chip} lots, on every page. Other statuses stay as they are`;
  const where = chip === 'All' ? 'the catalogue' : `${chip} lots`;
  return `Select all applies to ${count} lots matching “${q}” in ${where}, on every page`;
}

function toggleScope(c: any, scopeIds: string[]) {
  const state = pick(c);
  if (state.busy) return;
  const all = scopeIds.length > 0 && scopeIds.every((id) => state.ids[id]);
  if (all) {
    for (const id of scopeIds) delete state.ids[id];
  } else {
    for (const id of scopeIds) state.ids[id] = true;
  }
  c.commit();
}

function toggleOne(c: any, id: string) {
  const state = pick(c);
  if (state.busy || !id) return;
  if (state.ids[id]) delete state.ids[id];
  else state.ids[id] = true;
  c.commit();
}

function idsOf(items: any[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items || []) {
    const id = item?.id ? String(item.id) : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function resultMessage(res: { deleted?: string[]; archived?: string[] }): string {
  const deleted = res.deleted?.length || 0;
  const archived = res.archived?.length || 0;
  if (deleted && archived) return `Deleted ${deleted} minerals. Archived ${archived} that still have business records.`;
  if (archived) return `Archived ${archived} minerals that still have business records. They can no longer be purchased.`;
  if (deleted) return `Deleted ${deleted} mineral${deleted === 1 ? '' : 's'} from the catalogue.`;
  return 'Those minerals are already gone from the catalogue.';
}

async function confirmDelete(c: any) {
  const state = pick(c);
  if (state.busy) return;
  const ids = (state.pending.length ? state.pending : selectedIds(c)).slice();
  if (!ids.length) return;
  state.busy = true;
  c.commit();
  try {
    const res = await adminApi.post<{ deleted: string[]; archived: string[]; missing: string[] }>('/catalogue/lots/bulk-delete', { ids });
    const done = new Set([...(res.deleted || []), ...(res.archived || []), ...(res.missing || [])]);
    for (const id of done) delete state.ids[id];
    for (const id of ids) delete state.ids[id];
    state.pending = [];
    state.busy = false;
    try {
      const db = await getConsoleDb();
      if ((db as { live?: boolean }).live) c.setState({ db, drawer: null });
      else c.setState({ drawer: null });
    } catch {
      c.setState({ drawer: null });
    }
    c.commit(resultMessage(res));
  } catch (err) {
    state.busy = false;
    c.commit();
    c.toast(err instanceof AdminApiError ? err.message : 'Could not delete the selected minerals');
  }
}

function openConfirm(c: any) {
  const state = pick(c);
  if (state.busy) return;
  const ids = selectedIds(c);
  if (!ids.length) return;
  if (!V.can(c, 'catalogue')) return c.toast('Needs Catalogue manager — you are signed in as ' + V.me(c).label);
  state.pending = ids;
  c.openDrawer('lotBulk', 'confirm');
}

V.D.lotBulk = (c: any) => {
  const state = pick(c);
  const ids = state.pending.length ? state.pending : selectedIds(c);
  const n = ids.length;
  const busy = state.busy;
  return {
    title: 'Delete selected minerals',
    sub: 'Catalogue · Lots listed for buyers',
    pill: 'cannot be undone',
    pillStyle: V.pill('err'),
    text: `Are you sure you want to delete all ${n} selected minerals from the Catalogue? This action cannot be undone.`,
    fields: [
      { k: 'Selected', v: String(n) },
      { k: 'Warning', v: 'Minerals with buy orders, sell orders, auctions, inspections, contracts, or payments are archived so that history stays. Minerals with no business history are removed from the catalogue.' },
    ],
    sections: [],
    inputs: [],
    actions: [
      {
        label: busy ? 'Deleting…' : 'Confirm Delete',
        style: busy || !n ? V.B.off : V.B[3],
        disabled: busy || !n,
        go: () => { if (!busy && n) void confirmDelete(c); },
      },
      {
        label: 'Cancel',
        style: V.B[2],
        disabled: busy,
        go: () => { if (state.busy) return; c.setState({ drawer: null }); },
      },
    ],
  };
};

const table0 = V.table;
V.table = (c?: any, id?: any, cols?: any, items?: any, row?: any, opt?: any) => {
  if (id !== 'lots' || !isLotsScreen(c)) return table0(c, id, cols, items, row, opt);
  const scopeIds = idsOf(items);
  const chosen = pick(c);
  const all = scopeIds.length > 0 && scopeIds.every((lotId) => chosen.ids[lotId]);
  const some = scopeIds.some((lotId) => chosen.ids[lotId]);
  const n = selectedIds(c).length;
  return table0(c, id, [['', '36px']].concat(cols), items, (it?: any) => {
    const built = row(it);
    const lotId = it?.id ? String(it.id) : '';
    built.cells = [{ t: '', check: true, checked: !!(lotId && chosen.ids[lotId]), toggle: () => toggleOne(c, lotId) }].concat(built.cells || []);
    return built;
  }, Object.assign({}, opt, {
    headCheck: { checked: all, indeterminate: some && !all, go: () => toggleScope(c, scopeIds) },
    countExtra: ` · ${n} selected · ${scopeText(c, scopeIds.length)}`,
  }));
};

const page0 = V.page;
V.page = (c?: any) => {
  const out = page0(c);
  if (!isLotsScreen(c) || !out) return out;
  const n = selectedIds(c).length;
  const busy = pick(c).busy;
  const allowed = V.can(c, 'catalogue');
  const button = !allowed
    ? Object.assign(V.act(c, n ? `Delete Selected (${n})` : 'Delete Selected', () => {}, 3, 'catalogue'), { disabled: true })
    : n && !busy
      ? { label: `Delete Selected (${n})`, style: V.B[3], disabled: false, go: () => openConfirm(c) }
      : { label: n ? `Delete Selected (${n})` : 'Delete Selected', style: V.B.off, disabled: true, go: () => {} };
  const tools = (out.tools || []).slice();
  const at = tools.findIndex((tool: any) => String(tool?.label || '').indexOf('Upload master sheet') === 0);
  if (at >= 0) tools.splice(at + 1, 0, button);
  else tools.unshift(button);
  out.tools = tools;
  out.hasTools = true;
  out.hasChipsOrTools = true;
  return out;
};

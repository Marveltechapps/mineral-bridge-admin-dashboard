import { adminApi, AdminApiError } from '../../lib/adminApi';
import type { ConsoleDb } from '../../types/console';

export { discrepancySummary, sellPriceVariation } from './sellVariation';
export type { SellVariation } from './sellVariation';

/** Empty working set used before a staff session exists. It is not sample data. */
export function emptyConsole(): ConsoleDb {
  return {
    v: 4,
    live: false,
    lots: [],
    customers: [],
    kyc: [],
    orders: [],
    auctions: [],
    refunds: [],
    docs: [],
    threads: [],
    tpl: {},
    dtpl: [],
    deliveries: [],
    audit: [],
    settings: {},
    partners: [],
    admins: [],
  };
}

export interface StaffMe {
  id?: string;
  name?: string;
  email?: string;
  role?: { id?: string; name?: string };
}

const LIST_KEYS = ['lots', 'customers', 'kyc', 'orders', 'auctions', 'refunds', 'docs', 'threads', 'deliveries', 'audit', 'partners', 'admins'] as const;

/** Written onto the sell-request timeline when the inspection report step is saved. */
export function inspectionReportNote(input: { no: string; grade: string; net: number | string; result: string }) {
  return `Certificate ${input.no} · grade ${input.grade} · net ${input.net} · ${input.result}`;
}

const REPORT_NOTE = /^Certificate (.+?) · grade (.*?) · net ([0-9]+(?:\.[0-9]+)?) · (.+)$/;

export function parseInspectionReportNote(note: unknown): { no: string; grade: string; net: number; result: string } | null {
  const match = String(note || '').match(REPORT_NOTE);
  if (!match) return null;
  return { no: match[1] || '', grade: match[2] || '', net: Number(match[3]), result: match[4] || '' };
}

const AFTER_REPORT = new Set(['reportOk', 'approved', 'payout', 'ship', 'picked', 'transit', 'delivered', 'received', 'done']);

/**
 * The console payload stores the agency certificate on the order timeline and the file on issued
 * documents (linked by the order id). Rebuild `sgs` so the report stays visible after a refresh.
 */
function hydrateSellReports<T extends ConsoleDb>(db: T): T {
  const orders = Array.isArray(db.orders) ? db.orders as Array<Record<string, unknown>> : [];
  const docs = Array.isArray(db.docs) ? db.docs as Array<Record<string, unknown>> : [];
  for (const order of orders) {
    if (!order || order.kind !== 'sell' || order.sgs) continue;
    if (!AFTER_REPORT.has(String(order.serverStep || ''))) continue;
    const mine = docs.filter((doc) => doc && doc.status === 'issued' && (doc.eid === order.id || (order.orderId && doc.eid === order.orderId)));
    const cert = mine.find((doc) => /test certificate/i.test(String(doc.type || '')))
      || mine.find((doc) => /inspection report/i.test(String(doc.type || '')));
    const hist = Array.isArray(order.hist) ? order.hist as Array<{ note?: string }> : [];
    const meta = [...hist].reverse().map((row) => parseInspectionReportNote(row?.note)).find((row) => row != null) || null;
    if (!cert && !meta) continue;
    const insp = order.insp as { agency?: string; res?: { weight?: number } } | undefined;
    const sell = order.sell as { grade?: string; qty?: number } | undefined;
    order.sgs = {
      agency: insp?.agency || '',
      no: meta?.no || String(cert?.no || ''),
      grade: meta?.grade || sell?.grade || '',
      net: meta?.net ?? (insp?.res?.weight || sell?.qty || 0),
      result: meta?.result || 'Report issued',
      file: String(cert?.no || meta?.no || ''),
      docNo: String(cert?.no || ''),
      fileId: String(cert?.fileId || ''),
      at: cert?.at || order.sAt,
      liveDoc: Boolean(cert?.no),
    };
  }
  return db;
}

/** Loads every console page. The API returns one page; this follows `totals` so rows past the first page are not dropped. */
export async function getConsoleDb(): Promise<ConsoleDb> {
  try {
    const me = await adminApi.get<StaffMe>('me');
    // The role key (built-in or a custom role) comes from the server, so permissions follow the saved role.
    const access = await adminApi.get<{ roleKey?: string }>('me/actions').catch(() => ({} as { roleKey?: string }));
    const pageSize = 100;
    const first = await adminApi.get<ConsoleDb & { pageSize?: number; totals?: Record<string, number> }>(`console?page=1&pageSize=${pageSize}`);
    const totals = first.totals ?? {};
    const size = Number(first.pageSize) || pageSize;
    const pages = Math.min(20, Math.max(1, ...LIST_KEYS.map((key) => Math.ceil(Number(totals[key] ?? 0) / size))));
    const db: ConsoleDb = { ...first };
    for (let page = 2; page <= pages; page += 1) {
      const next = await adminApi.get<ConsoleDb>(`console?page=${page}&pageSize=${size}`);
      for (const key of LIST_KEYS) {
        const prev = Array.isArray(db[key]) ? db[key] as unknown[] : [];
        const more = Array.isArray(next[key]) ? next[key] as unknown[] : [];
        db[key] = [...prev, ...more];
      }
    }
    return hydrateSellReports({ ...db, live: true, staff: staffFromMe(me, access.roleKey), totals });
  } catch (err) {
    if (err instanceof AdminApiError && err.status === 401) return emptyConsole();
    throw err;
  }
}

export function staffFromMe(me: StaffMe, roleKey?: string) {
  const roleId = me.role?.id || '';
  const key = roleKey ? roleKey
    : roleId === 'ROLE-CEO' || me.role?.name === 'CEO' ? 'super'
    : roleId === 'ROLE-COMPLIANCE' ? 'compliance'
    : roleId === 'ROLE-SUPPORT' ? 'support'
    : 'ops';
  return {
    key,
    label: me.role?.name || 'Staff',
    name: me.name || 'Staff',
    email: me.email || '',
  };
}

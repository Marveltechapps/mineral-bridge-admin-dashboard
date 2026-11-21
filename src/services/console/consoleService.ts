import { adminApi, AdminApiError } from '../../lib/adminApi';
import type { ConsoleDb } from '../../types/console';

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
    return { ...db, live: true, staff: staffFromMe(me, access.roleKey), totals };
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

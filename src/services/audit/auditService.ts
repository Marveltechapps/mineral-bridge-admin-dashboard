import { apiRequest } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, formatDay, textOf } from '@/lib/wire';

export interface AuditRow {
  time: string;
  who: string;
  role: string;
  action: string;
  record: string;
  before: string;
  after: string;
  group: string;
}

const GROUP: Record<string, string> = {
  pricing: 'Pricing',
  compliance: 'Compliance',
  orders: 'Orders',
  vault: 'Vault',
  roles_access: 'Roles & access',
  content: 'Content',
  auth: 'Roles & access',
  financial: 'Orders',
};

export async function getAuditPage(signal?: AbortSignal): Promise<{ rows: AuditRow[]; total: number }> {
  const collected: Record<string, unknown>[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  let unfiltered = 0;
  while (collected.length < total && page <= 20) {
    const body = await apiRequest<{ data?: Record<string, unknown>[]; meta?: { total?: number; totalUnfiltered?: number } }>(`${ENDPOINTS.audit.log}?page=${page}&pageSize=100`, { signal });
    collected.push(...(body.data ?? []));
    total = typeof body.meta?.total === 'number' ? body.meta.total : collected.length;
    unfiltered = Number(body.meta?.totalUnfiltered ?? total);
    if (!(body.data ?? []).length) break;
    page += 1;
  }
  return {
    total: unfiltered,
    rows: collected.map((row) => {
      const actor = asRecord(row.actor);
      const record = asRecord(row.record);
      return {
        time: formatDay(row.at),
        who: textOf(actor?.name, 'System'),
        role: textOf(actor?.role, 'System'),
        action: textOf(row.action),
        record: textOf(record?.label) || textOf(record?.id),
        before: textOf(row.before, '—'),
        after: textOf(row.after, '—'),
        group: GROUP[textOf(row.category)] ?? 'Orders',
      };
    }),
  };
}

export async function queueAuditExport(): Promise<string> {
  const body = await apiRequest<{ message?: string }>(ENDPOINTS.audit.export, { method: 'POST', body: JSON.stringify({ filters: {}, format: 'csv' }) });
  return body.message || 'Audit log export queued — you will get an email';
}
